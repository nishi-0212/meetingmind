import json
import os
import re
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="MeetingMind API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Preferred chat models, best first. The first one your key has access to is used.
# You can force a model by putting GROQ_MODEL=... in .env
PREFERRED_MODELS = [
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "moonshotai/kimi-k2-instruct",
    "qwen/qwen3-32b",
    "openai/gpt-oss-20b",
    "llama-3.1-8b-instant",
]
NON_CHAT_HINTS = ("whisper", "tts", "guard", "playai", "distil", "compound")

_selected_model: Optional[str] = None


def available_models() -> List[str]:
    return [m.id for m in client.models.list().data]


def pick_model() -> str:
    global _selected_model
    if _selected_model:
        return _selected_model

    forced = os.getenv("GROQ_MODEL")
    if forced:
        _selected_model = forced
        return forced

    ids = available_models()
    for name in PREFERRED_MODELS:
        if name in ids:
            _selected_model = name
            return name

    chat_ids = [i for i in ids if not any(h in i.lower() for h in NON_CHAT_HINTS)]
    if not chat_ids:
        raise RuntimeError("No chat models available for this Groq API key")
    _selected_model = chat_ids[0]
    return _selected_model


class MeetingNotes(BaseModel):
    notes: str
    meeting_title: Optional[str] = "Untitled Meeting"


class ActionItem(BaseModel):
    task: str
    owner: str = "Unassigned"
    deadline_hint: str = "TBD"
    priority: str = "medium"


class MeetingAnalysis(BaseModel):
    summary: str
    action_items: List[ActionItem]
    key_decisions: List[str]
    follow_ups: List[str]
    sentiment: str
    model: str = ""


SYSTEM_PROMPT = """You are a meeting analyst. Read meeting notes and return ONLY a JSON object with exactly these keys:
{
  "summary": "2-3 sentence summary",
  "action_items": [
    {"task": "what to do", "owner": "person responsible or Unassigned",
     "deadline_hint": "ASAP | This week | Next week | TBD | specific date if mentioned",
     "priority": "high | medium | low"}
  ],
  "key_decisions": ["decision 1", "..."],
  "follow_ups": ["follow-up 1", "..."],
  "sentiment": "positive | neutral | negative"
}
Use only information present in the notes. Use lowercase for priority and sentiment. Output JSON only, no markdown."""


def extract_json(text: str) -> dict:
    text = re.sub(r"<think>.*?</think>", "", text or "", flags=re.S).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.S)
        if not match:
            raise
        return json.loads(match.group(0))


def call_model(model: str, user_prompt: str) -> dict:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
    except Exception as e:
        # Some models don't support JSON mode - retry without it
        if "response_format" not in str(e) and "json" not in str(e).lower():
            raise
        completion = client.chat.completions.create(
            model=model, messages=messages, temperature=0.2, max_tokens=2048
        )
    return extract_json(completion.choices[0].message.content)


@app.on_event("startup")
def show_model():
    try:
        print(f"MeetingMind using Groq model: {pick_model()}")
    except Exception as e:
        print(f"Could not list Groq models yet: {e}")


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "MeetingMind API", "model": _selected_model}


@app.get("/models")
def list_models():
    try:
        return {"selected": pick_model(), "available": available_models()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq error: {e}")


@app.post("/analyze-meeting", response_model=MeetingAnalysis)
def analyze_meeting(meeting: MeetingNotes):
    global _selected_model
    if not meeting.notes.strip():
        raise HTTPException(status_code=400, detail="Meeting notes are empty")

    user_prompt = f"Meeting Title: {meeting.meeting_title}\n\nMeeting Notes:\n{meeting.notes}"

    try:
        model = pick_model()
        try:
            data = call_model(model, user_prompt)
        except Exception as e:
            # Model got retired / no access: re-pick from live list and retry once
            if "model_not_found" in str(e) or "decommissioned" in str(e):
                _selected_model = None
                os.environ.pop("GROQ_MODEL", None)
                model = pick_model()
                data = call_model(model, user_prompt)
            else:
                raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Model returned invalid JSON, please try again")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq error: {e}")

    priority_ok = {"high", "medium", "low"}
    sentiment_ok = {"positive", "neutral", "negative"}

    action_items = []
    for item in data.get("action_items") or []:
        if not isinstance(item, dict) or not item.get("task"):
            continue
        priority = str(item.get("priority", "medium")).lower()
        action_items.append(
            ActionItem(
                task=str(item["task"]),
                owner=str(item.get("owner") or "Unassigned"),
                deadline_hint=str(item.get("deadline_hint") or "TBD"),
                priority=priority if priority in priority_ok else "medium",
            )
        )

    sentiment = str(data.get("sentiment", "neutral")).lower()

    return MeetingAnalysis(
        summary=str(data.get("summary", "")),
        action_items=action_items,
        key_decisions=[str(x) for x in data.get("key_decisions") or []],
        follow_ups=[str(x) for x in data.get("follow_ups") or []],
        sentiment=sentiment if sentiment in sentiment_ok else "neutral",
        model=model,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
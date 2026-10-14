# 🧠 MeetingMind — AI Meeting Notes Analyzer

[![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Groq](https://img.shields.io/badge/LLM-Groq-orange)](https://groq.com)
[![Vercel](https://img.shields.io/badge/Vercel-Live-black?logo=vercel)](https://YOUR-APP.vercel.app)

**MeetingMind** is an AI agent that turns messy, unstructured meeting notes into a clear, actionable brief — a summary, action items with owners, deadlines and priorities, key decisions, follow-ups and overall sentiment — in a few seconds.

👉  **[Try the Live App](https://meetingmind-psi.vercel.app/)**

---

## 🎯 Problem

Every team holds meetings, but the outcomes usually live in scattered notes. Someone has to re-read them, figure out who owns what and chase deadlines — and things slip through the cracks. MeetingMind does that extraction instantly, so a team leaves every meeting with a clean list of next steps. It works for any team, technical or not.

---

## 🧠 How It Works

```
Request Pipeline:

User Notes → Next.js UI → /api/analyze (proxy) → FastAPI /analyze-meeting → Groq LLM (JSON mode) → Validated Analysis

Validation Pipeline:

Raw LLM JSON → Pydantic Models → Normalised Priority & Sentiment → Defaults for Missing Fields → Response
```

1. **Input** — Paste raw notes, a transcript or bullet points (or click *Load sample*)
2. **Analysis** — The backend sends the notes to a Groq-hosted LLM with a strict JSON schema prompt
3. **Validation** — Pydantic models validate the output; missing owners or deadlines get safe defaults
4. **Results** — Summary, stats, action items, decisions and follow-ups, with one-click *Copy as Markdown*

---

## ✨ Features

- **Structured extraction** — Summary, action items, key decisions, follow-ups, sentiment
- **Owner + deadline + priority** for every action item
- **Auto model selection** — Picks the best Groq model available to your API key at startup, and re-selects automatically if a model is retired
- **Robust JSON handling** — JSON mode with fallback parsing, so the app doesn't crash on imperfect model output
- **Copy as Markdown** — Paste results straight into Slack, Notion or email
- **Linear-style dark UI** — Pastel accents, loading skeletons, `Ctrl + Enter` to analyze

---

## 📁 Project Structure

```
meetingmind/
├── pages/
│   ├── api/
│   │   └── analyze.js       # Next.js API route → proxies to FastAPI
│   ├── _app.js
│   ├── _document.js         # Inter font
│   └── index.js             # Main UI
├── styles/
│   └── globals.css          # Theme + components
├── main.py                  # FastAPI backend + Groq integration
├── requirements.txt         # Python dependencies
├── package.json             # Node dependencies
├── tailwind.config.js       # Pastel colour palette
├── postcss.config.js
├── next.config.js
└── .gitignore
```

---

## 🔌 API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze-meeting` | Analyze meeting notes → structured JSON |
| `GET` | `/health` | Health check + active model |
| `GET` | `/models` | Selected model + all models available to the key |

**Request**
```json
{
  "meeting_title": "Q4 Planning",
  "notes": "Rahul: technical specs by tomorrow..."
}
```

**Response**
```json
{
  "summary": "...",
  "action_items": [
    { "task": "Prepare technical specs", "owner": "Rahul", "deadline_hint": "Tomorrow", "priority": "high" }
  ],
  "key_decisions": ["..."],
  "follow_ups": ["..."],
  "sentiment": "positive",
  "model": "..."
}
```

---

## 🔧 Run Locally

```bash
git clone https://github.com/nishi-0212/meetingmind.git
cd meetingmind
```

Create a `.env` file in the project root:
```
GROQ_API_KEY=your_groq_api_key
BACKEND_URL=http://localhost:8000
```

Start the backend:
```bash
pip install -r requirements.txt
python main.py
```

Start the frontend (in a second terminal):
```bash
npm install
npm run dev
```

Open **http://localhost:3000**

> Optional: set `GROQ_MODEL=<model-id>` in `.env` to force a specific Groq model.

---

## 🚀 Deployment

| Part | Platform | Config |
|------|----------|--------|
| Backend | Render (Free Web Service) | Build: `pip install -r requirements.txt` · Start: `uvicorn main:app --host 0.0.0.0 --port $PORT` · Env: `GROQ_API_KEY` |
| Frontend | Vercel | Framework: Next.js · Env: `BACKEND_URL` = Render URL |

> Render's free tier sleeps after inactivity — the first request may take ~30–50 seconds.

---

## 📦 Tech Stack

| Layer | Tools |
|-------|-------|
| LLM | Groq API (auto-selected model) |
| Backend | FastAPI, Pydantic, Uvicorn |
| Frontend | Next.js 14, React 18 |
| Styling | Tailwind CSS, Inter |
| Hosting | Vercel, Render |

---

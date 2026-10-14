import { useState } from 'react'
import Head from 'next/head'
import axios from 'axios'

const SAMPLE_TITLE = 'Q4 Product Roadmap Planning'
const SAMPLE_NOTES = `Attendees: Priya (PM), Rahul (Engineering Lead), Neha (Design), Vikram (QA)

Priya shared customer feedback - performance is the biggest pain point for enterprise clients.

1. Performance optimization
- Rahul will lead backend optimization, target 40% faster API responses in 3 weeks
- Budget approved for infrastructure upgrades

2. Mobile app redesign
- Neha presented new mockups, team liked them
- Mobile conversion is 12%, goal is 25%
- Development starts next week

3. Payment gateway
- Vikram flagged integration issues with Razorpay, blocking release by 2 weeks

Decisions:
- Postpone mobile release by 1 week for quality
- Hire 2 more frontend developers
- Move payment integration to Q1

Next steps:
- Rahul: technical specs by tomorrow
- Neha: final designs by Friday
- Priya: inform stakeholders about the timeline change
- Follow-up meeting on Wednesday

Tone: productive, some timeline concerns but team is committed.`

const PRIORITY = {
  high: { dot: 'bg-peach', text: 'text-peach', label: 'High' },
  medium: { dot: 'bg-butter', text: 'text-butter', label: 'Medium' },
  low: { dot: 'bg-sky', text: 'text-sky', label: 'Low' },
}

const SENTIMENT = {
  positive: { cls: 'text-mint border-mint/30 bg-mint/10', label: 'Positive' },
  neutral: { cls: 'text-butter border-butter/30 bg-butter/10', label: 'Neutral' },
  negative: { cls: 'text-peach border-peach/30 bg-peach/10', label: 'Negative' },
}

function toMarkdown(title, r) {
  const out = [`## ${title || 'Untitled Meeting'}`, '', `**Summary:** ${r.summary}`, '']
  if (r.key_decisions.length) out.push('**Key decisions**', ...r.key_decisions.map((d) => `- ${d}`), '')
  if (r.action_items.length)
    out.push(
      '**Action items**',
      ...r.action_items.map((a) => `- [ ] ${a.task} — ${a.owner} · ${a.deadline_hint} · ${a.priority}`),
      ''
    )
  if (r.follow_ups.length) out.push('**Follow-ups**', ...r.follow_ups.map((f) => `- ${f}`), '')
  out.push(`**Sentiment:** ${r.sentiment}`)
  return out.join('\n')
}

function Section({ title, count, accent, children }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className={`h-1.5 w-1.5 rounded-full ${accent}`} />
        <h3 className="text-[13px] font-medium text-fg">{title}</h3>
        {count !== undefined && <span className="text-[12px] text-muted">{count}</span>}
      </div>
      {children}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="panel p-5 space-y-3">
          <div className="h-3 w-24 rounded shimmer" />
          <div className="h-3 w-full rounded shimmer" />
          <div className="h-3 w-4/5 rounded shimmer" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="panel h-full min-h-[420px] flex flex-col items-center justify-center text-center p-10">
      <div className="h-12 w-12 rounded-xl border border-line bg-white/[0.03] flex items-center justify-center mb-5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-lavender">
          <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round" />
          <path d="M17 15l2 2 3-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-fg text-[15px] font-medium">Your analysis will appear here</p>
      <p className="text-muted text-[13px] mt-1 max-w-xs">
        Summary, owners, deadlines, decisions and follow-ups — extracted in seconds.
      </p>
    </div>
  )
}

export default function Home() {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const analyze = async () => {
    if (!notes.trim()) return setError('Paste some meeting notes first.')
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const { data } = await axios.post('/api/analyze', {
        meeting_title: title || 'Untitled Meeting',
        notes,
      })
      setResult(data)
    } catch (err) {
      const d = err.response?.data
      setError((typeof d?.detail === 'string' && d.detail) || d?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(title, result))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Could not copy to clipboard')
    }
  }

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyze()
  }

  const sentiment = result && (SENTIMENT[result.sentiment] || SENTIMENT.neutral)

  return (
    <div className="min-h-screen bg-bg text-fg relative overflow-hidden">
      <Head>
        <title>MeetingMind — AI meeting notes analyzer</title>
      </Head>

      <div className="glow" aria-hidden />

      {/* Nav */}
      <header className="relative z-10 border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-lavender to-pink" />
            <span className="text-[14px] font-semibold tracking-tight">MeetingMind</span>
          </div>
          <span className="text-[12px] text-muted border border-line rounded-full px-3 py-1">
            Powered by Groq
          </span>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 text-[12px] text-muted border border-line rounded-full px-3 py-1 mb-6 bg-white/[0.02]">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            AI agent for every team
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.05] gradient-text">
            Messy meeting notes in.
            <br />
            Clear next steps out.
          </h1>
          <p className="text-muted text-[16px] md:text-[18px] mt-5 max-w-xl mx-auto">
            Paste notes from any meeting. MeetingMind pulls out the summary, who owns what, deadlines and decisions.
          </p>
        </section>

        {/* Workspace */}
        <section className="grid lg:grid-cols-[1fr_1.15fr] gap-5 pb-20">
          {/* Input */}
          <div className="panel p-5 h-fit lg:sticky lg:top-6">
            <label className="label">Meeting title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Planning"
              className="field mb-5"
            />

            <div className="flex items-center justify-between mb-2">
              <label className="label !mb-0">Meeting notes</label>
              <button
                onClick={() => {
                  setTitle(SAMPLE_TITLE)
                  setNotes(SAMPLE_NOTES)
                  setError('')
                }}
                className="text-[12px] text-lavender hover:text-fg transition-colors"
              >
                Load sample
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={onKeyDown}
              rows={16}
              placeholder="Paste raw notes, a transcript, or bullet points…"
              className="field resize-y font-mono text-[13px] leading-relaxed"
            />

            {error && (
              <div className="mt-4 text-[13px] text-peach border border-peach/25 bg-peach/[0.06] rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between mt-5">
              <span className="text-[12px] text-muted">
                {notes.length.toLocaleString()} chars · <kbd className="kbd">Ctrl</kbd> <kbd className="kbd">Enter</kbd>
              </span>
              <button onClick={analyze} disabled={loading} className="btn-primary">
                {loading ? (
                  <>
                    <span className="spinner" /> Analyzing
                  </>
                ) : (
                  'Analyze meeting →'
                )}
              </button>
            </div>
          </div>

          {/* Output */}
          <div>
            {loading && <Skeleton />}
            {!loading && !result && <EmptyState />}

            {!loading && result && (
              <div className="space-y-4 fade-in">
                {/* Summary */}
                <div className="panel p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-[12px] text-muted">Summary</p>
                      <h2 className="text-[17px] font-medium mt-0.5">{title || 'Untitled Meeting'}</h2>
                    </div>
                    <button onClick={copy} className="btn-ghost">
                      {copied ? 'Copied ✓' : 'Copy as Markdown'}
                    </button>
                  </div>
                  <p className="text-[14px] leading-relaxed text-fg/85">{result.summary}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
                    <div className="stat">
                      <span className="stat-n text-lavender">{result.action_items.length}</span>
                      <span className="stat-l">Action items</span>
                    </div>
                    <div className="stat">
                      <span className="stat-n text-mint">{result.key_decisions.length}</span>
                      <span className="stat-l">Decisions</span>
                    </div>
                    <div className="stat">
                      <span className="stat-n text-sky">{result.follow_ups.length}</span>
                      <span className="stat-l">Follow-ups</span>
                    </div>
                    <div className="stat">
                      <span className={`text-[12px] font-medium border rounded-full px-2.5 py-0.5 w-fit ${sentiment.cls}`}>
                        {sentiment.label}
                      </span>
                      <span className="stat-l">Sentiment</span>
                    </div>
                  </div>
                </div>

                {/* Action items */}
                {result.action_items.length > 0 && (
                  <Section title="Action items" count={result.action_items.length} accent="bg-lavender">
                    <div className="divide-y divide-line -mx-5">
                      {result.action_items.map((a, i) => {
                        const p = PRIORITY[a.priority] || PRIORITY.medium
                        return (
                          <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                            <span className={`mt-[7px] h-2 w-2 rounded-full shrink-0 ${p.dot}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] text-fg">{a.task}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[12px] text-muted">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="avatar">{(a.owner || '?').charAt(0).toUpperCase()}</span>
                                  {a.owner}
                                </span>
                                <span>Due: {a.deadline_hint}</span>
                              </div>
                            </div>
                            <span className={`text-[11px] font-medium ${p.text}`}>{p.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </Section>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {result.key_decisions.length > 0 && (
                    <Section title="Key decisions" count={result.key_decisions.length} accent="bg-mint">
                      <ul className="space-y-2.5">
                        {result.key_decisions.map((d, i) => (
                          <li key={i} className="text-[13px] text-fg/85 flex gap-2.5">
                            <span className="text-mint">✓</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {result.follow_ups.length > 0 && (
                    <Section title="Follow-ups" count={result.follow_ups.length} accent="bg-sky">
                      <ul className="space-y-2.5">
                        {result.follow_ups.map((f, i) => (
                          <li key={i} className="text-[13px] text-fg/85 flex gap-2.5">
                            <span className="text-sky">→</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}
                </div>

                {result.model && <p className="text-[11px] text-muted text-right">Model: {result.model}</p>}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
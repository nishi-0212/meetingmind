export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' })
  }

  const { meeting_title, notes } = req.body || {}
  if (!notes || !notes.trim()) {
    return res.status(400).json({ detail: 'Meeting notes are required' })
  }

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'

  try {
    const response = await fetch(`${backendUrl}/analyze-meeting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meeting_title: meeting_title || 'Untitled Meeting',
        notes,
      }),
    })

    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { detail: text || 'Unexpected response from backend' }
    }

    return res.status(response.status).json(data)
  } catch (error) {
    console.error('Backend not reachable:', error)
    return res.status(502).json({
      detail: 'Backend is not running. Start it with: python main.py',
    })
  }
}
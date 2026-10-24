import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '10kb' }))

// API pedagógica: solo maneja estados en memoria. Nunca ejecuta comandos de SO.
const fresh = () => ({ confidentiality: 100, integrity: 100, availability: 100, bossDefeated: false, events: [] })
let state = fresh()
const types = { C: 'confidentiality', I: 'integrity', A: 'availability' }
app.get('/api/health', (_req, res) => res.json({ ok: true, mode: 'simulation' }))
app.get('/api/state', (_req, res) => res.json(state))
app.post('/api/reset', (_req, res) => { state = fresh(); res.json(state) })
app.post('/api/event', (req, res) => {
  const { type } = req.body ?? {}
  if (!Object.hasOwn(types, type)) return res.status(400).json({ error: 'Tipo inválido (C, I, A)' })
  const key = types[type]
  state[key] = Math.max(0, state[key] - 12.5)
  state.events.unshift({ type, description: `Incidente ${type} simulado`, at: new Date().toISOString() })
  state.events = state.events.slice(0, 100)
  res.json(state)
})
app.post('/api/boss-defeated', (_req, res) => {
  state = { ...state, confidentiality: 0, integrity: 0, availability: 0, bossDefeated: true }
  state.events.unshift({ type: 'BOSS', description: 'Kernel panic simulado', at: new Date().toISOString() })
  res.json(state)
})
const PORT = Number(process.env.PORT || 3001)
app.listen(PORT, '127.0.0.1', () => console.log(`API didáctica en http://127.0.0.1:${PORT}`))

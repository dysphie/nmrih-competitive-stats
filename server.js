import 'dotenv/config'
import express from 'express'
import { createTables } from './queries.js'

import rounds from './routes/rounds.js'
import maps from './routes/maps.js'
import tiers from './routes/tiers.js'
import players from './routes/players.js'
import kills from './routes/kills.js'
import performances from './routes/performances.js'
import mutators from './routes/mutators.js'
import admin from './middleware/admin.js'

import { rateLimit } from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
})

const app = express()
const PORT = 3000

await createTables()

app.use(limiter)
app.use(express.json())

app.post('*', admin)

app.use('/tiers', tiers)
app.use('/maps', maps)
app.use('/rounds', rounds)
app.use('/players', players)
app.use('/kills', kills)
app.use('/performances', performances)
app.use('/mutators', mutators)

app.get('/', async (req, res) => {
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

export default app

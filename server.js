import express from 'express'
import dotenv from 'dotenv'
import { createTables } from './queries.js'
import routes from './routes/index.js'

import { rateLimit } from 'express-rate-limit'

dotenv.config()

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
})

const app = express()
const PORT = 3000

await createTables()

app.use(limiter)
app.use(express.json())
app.use('/tiers', routes.tiers)
app.use('/maps', routes.maps)
app.use('/rounds', routes.rounds)
app.use('/players', routes.players)
app.use('/kills', routes.kills)
app.use('/performances', routes.performances)

app.get('/', async (req, res) => {
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

export default app

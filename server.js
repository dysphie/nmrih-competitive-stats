import express from 'express'
import dotenv from 'dotenv'
import { createTables } from './queries.js'
import routes from './routes/index.js'

dotenv.config()

const app = express()
const PORT = 3000

await createTables()

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

import express from 'express'
import { searchMaps } from '../queries.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const maps = await searchMaps()
    res.status(200).json(maps)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

export default router

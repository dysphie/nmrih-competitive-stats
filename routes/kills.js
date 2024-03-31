import express from 'express'
import { body, validationResult } from 'express-validator'
import { registerKills } from '../queries.js'

const router = express.Router()
router.post('/', [
  body('performance').isInt({ min: 1 }),
  body('kills').isArray(),
  body('kills.*.player').isInt(),
  body('kills.*.npc_type').isInt(),
  body('kills.*.hitgroup').isInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { performance, kills } = req.body

  try {
    await registerKills(performance, kills)
    res.sendStatus(200)
  } catch (error) {
    console.log('Error occurred while fetching players:', error)
    res.sendStatus(500)
  }
})

export default router

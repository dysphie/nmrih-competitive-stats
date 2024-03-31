import express from 'express'
import { getAllMapTiers, registerTier } from '../queries.js'
import { body, validationResult } from 'express-validator'

const router = express.Router()

router.post('/', [
  body('name').optional().isLength({ min: 1 }),
  body('points').optional().isInt({ min: 0 }).toInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { name, points } = req.body
    const id = await registerTier(name, points)
    res.status(200).json({ id })
  } catch (error) {
    console.log('Error occurred while registering tier:', error)
    res.sendStatus(500)
  }
})

router.get('/', async (req, res) => {
  try {
    const tiers = await getAllMapTiers()
    res.status(200).json(tiers)
  } catch (error) {
    console.log('Error occurred while getting tiers:', error)
    res.sendStatus(500)
  }
})

export default router

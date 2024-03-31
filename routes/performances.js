import express from 'express'
import { getPerformance, registerPerformance } from '../queries.js'
import { body, param, validationResult } from 'express-validator'

const router = express.Router()

router.post('/', [
  body('player').isInt({ min: 1 }),
  body('round').isInt({ min: 1 }),
  body('end_reason').isLength({ min: 1 }),
  body('kills').isInt({ min: 0 }),
  body('deaths').isInt({ min: 0 }),
  body('damage_taken').isInt({ min: 0 }),
  body('extraction_time').isInt({ min: 0 }),
  body('presence').isInt({ min: 0 }),
  body('exp_earned').isInt({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    // eslint-disable-next-line camelcase
    const { player, round, end_reason, kills, deaths, damage_taken, extraction_time, presence, exp_earned } = req.body
    const id = await registerPerformance(player, round, end_reason, kills, deaths, damage_taken, extraction_time, presence, exp_earned)
    res.status(200).json({ id })
  } catch (error) {
    console.log('Error occurred while registering performance: ', error)
    res.sendStatus(500)
  }
})

router.get('/:id', [
  param('id').isInt({ min: 1 }).toInt()
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const performance = await getPerformance(id)

    console.log(`${JSON.stringify(performance, null, 2)}`)

    if (!performance) {
      return res.sendStatus(404)
    }

    res.status(200).json(performance)
  } catch (error) {
    console.log('Error occurred while fetching performance:', error)
    res.sendStatus(500)
  }
})

export default router

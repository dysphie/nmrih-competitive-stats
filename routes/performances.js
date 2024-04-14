import express from 'express'
import { getPerformance, getPlayer, getRound, registerPerformance, searchPerformances } from '../queries.js'
import { body, query, param, validationResult } from 'express-validator'

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

    const existingPlayer = await getPlayer(player)
    if (!existingPlayer) {
      return res.status(400).json({ error: 'Invalid player ID' })
    }

    const existingRound = await getRound(round)
    if (!existingRound) {
      return res.status(400).json({ error: 'Invalid round ID' })
    }

    const id = await registerPerformance(player, round, end_reason, kills, deaths, damage_taken, extraction_time, presence, exp_earned)
    res.status(200).json({ id })
  } catch (error) {
    console.log('Error occurred while registering performance: ', error)
    res.sendStatus(500)
  }
})

router.get('/', [
  query('mutators').isArray(),
  query('mutators.*').isInt({ min: 1 })
],
async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { mutators } = req.query

  try {
    const history = await searchPerformances(mutators)
    res.status(200).json(history)
  } catch (error) {
    console.error(error)
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

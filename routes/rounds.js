import express from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { getRound, getRounds, registerRound } from '../queries.js'

const router = express.Router()

router.post('/', [
  body('map').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { map } = req.body

  try {
    const id = await registerRound(map)
    res.status(200).json({ id })
  } catch (error) {
    console.log('Error occurred while registering round: ', error)
    res.sendStatus(500)
  }
})

router.get('/', [
  query('offset').isInt({ min: 0 }).toInt().default(0),
  query('limit').isInt({ min: 1, max: 30 }).toInt().default(10),
  query('player').isInt({ min: 1 }).toInt().default(null),
  query('map_name').optional().isLength({ min: 3 }),
  query('sort').isIn(['asc', 'desc']).default('asc')
],
async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { limit, offset, player, map, sort } = req.query

  try {
    const history = await getRounds(limit, offset, sort === 'asc', player, map)
    res.status(200).json(history)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

router.get('/:id', [
  param('id').isInt({ min: 1 }).toInt()
],
async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { id } = req.params

  try {
    const round = await getRound(id)
    res.status(200).json(round)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

export default router

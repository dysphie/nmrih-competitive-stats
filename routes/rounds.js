import express from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { getRound, getRounds, registerRound } from '../queries.js'

const router = express.Router()

router.post('/', [
  body('map').isInt({ min: 1 }),
  body('mutators').default([]).isArray(),
  body('mutators.*').isInt()
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { map, mutators } = req.body

  try {
    const id = await registerRound(map, mutators)
    res.status(200).json({ id })
  } catch (error) {
    console.log('Error occurred while registering round: ', error)
    res.sendStatus(500)
  }
})

router.get('/', [
  query('offset').default(0).isInt({ min: 0 }).toInt(),
  query('limit').default(10).isInt({ min: 1, max: 30 }).toInt(),
  query('player').optional().isInt({ min: 1 }).toInt(),
  query('map_name').optional().isLength({ min: 3 }),
  query('sort').default('asc').isIn(['asc', 'desc'])
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

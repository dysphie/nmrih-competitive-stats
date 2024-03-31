import express from 'express'
import { query, validationResult } from 'express-validator'
import { getRoundHistory } from '../queries.js'

const router = express.Router()
router.get('/', [
  query('offset').optional().isInt({ min: 0 }).toInt().default(0),
  query('limit').optional().isInt({ min: 1, max: 30 }).toInt().default(10),
  query('player').optional().isInt({ min: 1 }).toInt().default(null),
  query('map_name').optional().isLength({ min: 3 }),
  query('sort').optional().isIn(['asc', 'desc']).default('asc')
],
async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { limit, offset, player, map, sort } = req.query

  try {
    const history = await getRoundHistory(limit, offset, sort === 'asc', player, map)
    res.status(200).json(history)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

export default router

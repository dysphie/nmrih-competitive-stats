import express from 'express'
import { param, query, validationResult } from 'express-validator'
import { getLeaderboard, getLeaderboardAroundPlayer } from '../queries'

const router = express.Router()

router.get('/:type', [
  param('type').matches(/^(exp|kills|kdr)$/),
  query('offset').default(0).isInt({ min: 0 }).toInt(),
  query('limit').default(50).isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { limit, offset } = req.query
  const { type } = req.params

  try {
    const leaderboard = await getLeaderboard(type, limit, offset)
    res.status(200).json(leaderboard)
  } catch (error) {
    res.sendStatus(500)
  }
})

router.get('/:type/:player', [
  param('type').matches(/^(exp|kills|kdr)$/),
  param('player').isInt({ min: 1 }).toInt(),
  query('radius').optional().isInt({ min: 1, max: 5 }).toInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { type, player } = req.params
  const { radius } = req.params

  try {
    const leaderboard = await getLeaderboardAroundPlayer(type, player, radius)
    res.status(200).json(leaderboard)
  } catch (error) {
    res.sendStatus(500)
  }
})

export default router

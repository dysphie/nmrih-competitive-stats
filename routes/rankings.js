import express from 'express'
import { param, query, validationResult } from 'express-validator'
import { getLeaderboardAroundPlayer, getLeaderboardMostExp } from '../queries'

const router = express.Router()

router.get('/exp', [
  query('offset').optional().isInt({ min: 0 }).toInt().default(0),
  query('limit').optional().isInt({ min: 1, max: 30 }).toInt().default(10)
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const leaderboard = getLeaderboardMostExp(req.params.player, req.query.radius)
    res.status(200).json(leaderboard)
  } catch (error) {
    res.sendStatus(500)
  }
})

router.get('/exp/:player', [
  param('player').isInt({ min: 1 }).toInt(),
  query('radius').optional().isInt({ min: 1, max: 5 }).toInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const leaderboard = getLeaderboardAroundPlayer('exp', req.params.player, req.query.radius)
    res.status(200).json(leaderboard)
  } catch (error) {
    res.sendStatus(500)
  }
})

export default router
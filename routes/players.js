import express from 'express'
import { getPlayer, searchPlayers } from '../queries.js'
import { param, query, validationResult } from 'express-validator'

const router = express.Router()

router.get('/search', [
  query('name').optional().isLength({ min: 3 })
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name } = req.query

  try {
    const players = await searchPlayers(name)
    res.status(200).json(players)
  } catch (error) {
    console.log('Error occurred while searching players:', error)
    res.sendStatus(500)
  }
})

router.get('/:id', [
  param('id').isInt({ min: 1 }).toInt(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const [player] = await getPlayer(id)

    if (!player) {
      return res.sendStatus(404)
    }

    res.status(200).json(player)
  } catch (error) {
    console.log('Error occurred while fetching player:', error)
    res.sendStatus(500)
  }
})

export default router

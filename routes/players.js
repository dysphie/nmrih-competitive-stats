import express from 'express'
import { getKills, getPlayer, registerPlayer, searchPlayers } from '../queries.js'
import { body, param, query, validationResult } from 'express-validator'

const router = express.Router()

router.post('/', [
  body('steam').isLength({ min: 1 }),
  body('name').isLength({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { steam, name } = req.body
    const id = await registerPlayer(steam, name)
    res.status(200).json({ id })
  } catch (error) {
    console.log('Error occurred while registering player: ', error)
    res.sendStatus(500)
  }
})

router.get('/', [
  query('q').isLength({ min: 3 })
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { q } = req.query

  try {
    const players = await searchPlayers(q)
    res.status(200).json(players)
  } catch (error) {
    console.log('Error occurred while searching players:', error)
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
    const player = await getPlayer(id)

    if (!player) {
      return res.sendStatus(404)
    }

    res.status(200).json(player)
  } catch (error) {
    console.log('Error occurred while fetching player:', error)
    res.sendStatus(500)
  }
})

router.get('/:id/kills', [
  param('id').isInt({ min: 1 }).toInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  console.log('HELLO FROM KILLS')
  const { id } = req.params
  const player = await getPlayer(id)

  if (!player) {
    return res.sendStatus(404)
  }

  try {
    const kills = await getKills(id)
    res.status(200).json(kills)
  } catch (error) {
    console.log('Error occurred while fetching kills:', error)
    res.sendStatus(500)
  }
})

export default router

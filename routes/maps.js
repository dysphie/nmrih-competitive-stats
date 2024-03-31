import express from 'express'
import { getMap, registerMap, searchMaps } from '../queries.js'
import { body, param, query, validationResult } from 'express-validator'

const router = express.Router()

router.post('/', [
  body('file').isLength({ min: 1 }),
  body('name').isLength({ min: 1 }),
  body('tier').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { file, name, tier } = req.body
    const id = await registerMap(file, name, tier)
    res.status(200).json({ id })
  } catch (error) {
    console.log('Error occurred while registering map: ', error)
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
    const [map] = await getMap(id)

    if (!map) {
      return res.sendStatus(404)
    }

    res.status(200).json(map)
  } catch (error) {
    console.log('Error occurred while fetching map:', error)
    res.sendStatus(500)
  }
})

router.get('/', [
  query('name').optional().isLength({ min: 3 })
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name } = req.query
  try {
    const maps = await searchMaps(name)
    res.status(200).json(maps)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

export default router

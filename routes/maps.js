import express from 'express'
import { getMap, registerMap, searchMaps, deleteMap, updateMap } from '../queries.js'
import { body, param, query, validationResult } from 'express-validator'

const router = express.Router()

router.post('/', [
  body('file').isLength({ min: 1 }),
  body('name').isLength({ min: 1 }),
  body('tier').isInt({ min: 1 }),
  body('mutators').default([]).isArray(),
  body('mutators.*').isInt()
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    // eslint-disable-next-line camelcase
    const { file, name, tier, mutators } = req.body
    const id = await registerMap(file, name, tier, mutators)
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
    const map = await getMap(id)

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
  query('q').optional().isLength({ min: 3 })
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { q } = req.query
  try {
    const maps = await searchMaps(q)
    res.status(200).json(maps)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

router.delete('/:id', [
  param('id').isInt({ min: 1 }).toInt()
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { id } = req.params
  try {
    const mapDeleted = await deleteMap(id)
    res.sendStatus(mapDeleted ? 204 : 404)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

router.put('/:id', [
  param('id').isInt({ min: 1 }).toInt(),
  body('file').optional().isLength({ min: 1 }),
  body('name').optional().isLength({ min: 1 }),
  body('tier').optional().isInt({ min: 1 }),
  body('base_mutator_id').optional().isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { id } = req.params
  // eslint-disable-next-line camelcase
  const { file, name, tier, base_mutator_id } = req.body
  try {
    await updateMap(id, file, name, tier, base_mutator_id)
    res.sendStatus(204)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

export default router

import express from 'express'
import { getMutator, getMutators, registerMutator } from '../queries.js'
import { body, param, validationResult } from 'express-validator'

const router = express.Router()

router.post('/', [
  body('name').isLength({ min: 1 }),
  body('points_multiplier').isFloat({ min: 0.0 }).toFloat(),
  body('cvars').isArray(),
  body('cvars.*.name').isLength({ min: 1 }),
  body('cvars.*.value').default('')
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    // eslint-disable-next-line camelcase
    const { name, points_multiplier, cvars } = req.body
    const id = await registerMutator(name, points_multiplier, cvars)
    res.status(200).json({ id })
  } catch (error) {
    console.log('Error occurred while registering mutator: ', error)
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
    const mutator = await getMutator(id)

    if (!mutator) {
      return res.sendStatus(404)
    }

    res.status(200).json(mutator)
  } catch (error) {
    console.log('Error occurred while fetching mutator:', error)
    res.sendStatus(500)
  }
})

router.get('/', [
], async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const mutators = await getMutators()
    res.status(200).json(mutators)
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
})

export default router

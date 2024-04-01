import { header } from 'express-validator'

const middleware = [
  header('authorization').isLength({ min: 64 }).withMessage('Token must be at least 64 characters long'),

  (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || authHeader !== process.env.ADMIN_AUTH_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    next()
  }
]

export default middleware

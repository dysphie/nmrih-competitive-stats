const middleware = (req, res, next) => {
  const authHeader = req.headers.authentication
  if (!authHeader || authHeader !== process.env.ADMIN_AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

export default middleware

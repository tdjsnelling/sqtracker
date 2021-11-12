import jwt from 'jsonwebtoken'
import User from '../schema/user'

const auth = async (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.replace('Bearer ', '')
    try {
      const decoded = jwt.verify(token, process.env.SQ_JWT_SECRET)

      if (decoded) {
        const user = await User.findOne({ _id: decoded.id })

        if (user) {
          if (token === user.token) {
            req.userId = user._id
            next()
          } else {
            res.sendStatus(401)
          }
        } else {
          res.sendStatus(404)
        }
      } else {
        res.sendStatus(500)
      }
    } catch (err) {
      res.status(500).send(err)
    }
  } else {
    res.sendStatus(401)
  }
}

export default auth

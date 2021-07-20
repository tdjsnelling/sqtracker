import memoize from 'memoizee'
import User from '../schema/user'

const userLookup = async (userId) => {
  return User.findOne({ uid: userId })
}

const userLookupMemo = memoize(userLookup)

const announceParseUser = async (req, res, next) => {
  const userId = req.path.split('/')[1]
  req.userId = userId

  const user = await userLookupMemo(userId)

  if (!user) res.sendStatus(401)
  else next()
}

export default announceParseUser

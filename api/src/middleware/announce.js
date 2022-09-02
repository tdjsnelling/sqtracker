import memoize from 'memoizee'
import querystring from 'querystring'
import User from '../schema/user'
import Torrent from '../schema/torrent'
import Progress from '../schema/progress'
import { getUserRatio } from '../utils/ratio'

const userLookup = async (userId) => {
  return User.findOne({ uid: userId }).lean()
}

const userLookupMemo = memoize(userLookup)

export const binaryToHex = (b) => Buffer.from(b, 'binary').toString('hex')
export const hexToBinary = (h) => Buffer.from(h, 'hex').toString('binary')

const parseParams = (query) =>
  querystring.parse(query, null, null, {
    decodeURIComponent: unescape,
  })

const handleAnnounce = async (req, res, next) => {
  const userId = req.baseUrl.split('/')[2]
  req.userId = userId

  console.log(`[DEBUG] userId: ${userId}`)

  const user = await userLookupMemo(userId)

  // if the uid does not match a registered user, deny announce
  if (!user) {
    res.statusMessage = 'User not registered'
    res.sendStatus(401)
    return
  }

  const q = req.url.split('?')[1]
  const params = parseParams(q)

  const infoHash = binaryToHex(params.info_hash)

  console.log(`[DEBUG] query: ${JSON.stringify(params)}`)
  console.log(`[DEBUG] infoHash: ${infoHash}`)

  const torrent = await Torrent.findOne({ infoHash }).lean()

  // if torrent info hash is not in the database, deny announce
  if (!torrent) {
    res.statusMessage = 'Cannot index a torrent that has not been uploaded'
    res.sendStatus(406)
    return
  }

  const ratio = await getUserRatio(user._id)

  console.log(`[DEBUG] user ratio: ${ratio}`)

  // if users ratio is below the minimum threshold and they are trying to download, deny announce
  if (
    ratio < Number(process.env.SQ_MINIMUM_RATIO) &&
    ratio !== -1 &&
    Number(params.left > 0)
  ) {
    res.statusMessage = 'Ratio is below minimum threshold'
    res.sendStatus(403)
    return
  }

  await Progress.findOneAndUpdate(
    { userId: user._id, infoHash },
    {
      $set: {
        userId: user._id,
        infoHash,
        uploaded: params.uploaded,
        downloaded: !torrent.freeleech ? params.downloaded : 0,
        left: params.left,
      },
    },
    { upsert: true }
  )

  next()
}

export default handleAnnounce

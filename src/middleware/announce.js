import memoize from 'memoizee'
import querystring from 'querystring'
import dotenv from 'dotenv'
import User from '../schema/user'
import Torrent from '../schema/torrent'

dotenv.config()

const userLookup = async (userId) => {
  return User.findOne({ uid: userId })
}

const userLookupMemo = memoize(userLookup)

const binaryToHex = (b) => Buffer.from(b, 'binary').toString('hex')

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

  const torrent = await Torrent.findOne({ infoHash })

  // if torrent info hash is not in the database, deny announce
  if (!torrent) {
    res.statusMessage = 'Cannot index a torrent that has not been uploaded'
    res.sendStatus(406)
    return
  }

  let totalUp = 0
  let totalDown = 0

  for (const userInfoHash in user.torrents) {
    const torrent = user.torrents[userInfoHash]
    totalUp += Number(torrent.uploaded)
    totalDown += Number(torrent.downloaded)
  }

  const ratio = totalDown === 0 ? -1 : Number((totalUp / totalDown).toFixed(2))

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

  await User.findOneAndUpdate(
    { uid: req.userId },
    {
      $set: {
        [`torrents.${infoHash}`]: {
          uploaded: params.uploaded,
          downloaded: params.downloaded,
          left: params.left,
        },
      },
    }
  )

  next()
}

export default handleAnnounce

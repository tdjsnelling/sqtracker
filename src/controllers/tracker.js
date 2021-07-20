import querystring from 'querystring'
import User from '../schema/user'

const binaryToHex = (b) => Buffer.from(b, 'binary').toString('hex')

const parseParams = (query) =>
  querystring.parse(query, null, null, {
    decodeURIComponent: unescape,
  })

export const handleAnnounce = async (req) => {
  const q = req.url.split('?')[1]
  const params = parseParams(q)

  const infoHash = binaryToHex(params.info_hash)

  console.log(`[DEBUG] userId: ${req.userId}`)
  console.log(`[DEBUG] query: ${JSON.stringify(params, null, 2)}`)
  console.log(`[DEBUG] infoHash: ${infoHash}`)

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
}

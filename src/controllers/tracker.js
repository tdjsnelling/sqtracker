import querystring from 'querystring'
import bencode from 'bencode'
import User from '../schema/user'
import Torrent from '../schema/torrent'

const binaryToHex = (b) => Buffer.from(b, 'binary').toString('hex')

const parseParams = (query) =>
  querystring.parse(query, null, null, {
    decodeURIComponent: unescape,
  })

export const handleAnnounceRequest = async (req) => {
  const q = req.url.split('?')[1]
  const params = parseParams(q)

  const infoHash = binaryToHex(params.info_hash)

  console.log(`[DEBUG] userId: ${req.userId}`)
  console.log(`[DEBUG] query: ${JSON.stringify(params)}`)
  console.log(`[DEBUG] infoHash: ${infoHash}`)

  const torrent = await Torrent.findOne({ infoHash })

  if (!torrent) {
    req.fail = {
      code: 401,
      reason: 'Cannot index a torrent that has not been uploaded',
    }
  } else {
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
}

export const handleAnnounceResponse = async (
  responseBuffer,
  proxyRes,
  req,
  res
) => {
  if (req.fail) {
    console.log('[DEBUG] denying announce as torrent has not been uploaded')
    res.statusCode = req.fail.code
    res.statusMessage = `sqtracker: ${req.fail.reason}`
    return ''
  }

  const trackerResponse = bencode.decode(responseBuffer)
  const updatedResponse = {
    ...trackerResponse,
    interval: 30,
    'min interval': 30,
  }
  const bencoded = bencode.encode(updatedResponse)
  console.log(`[DEBUG] tracker response: ${bencoded}`)
  return bencoded
}

import qs from 'qs'
import bencode from 'bencode'
import User from '../schema/user'
import Torrent from '../schema/torrent'
import Progress from '../schema/progress'
import { getUserRatio } from '../utils/ratio'

const BYTES_GB = 1.074e9

export const binaryToHex = (b) => Buffer.from(b, 'binary').toString('hex')
export const hexToBinary = (h) => Buffer.from(h, 'hex').toString('binary')

const handleAnnounce = async (req, res, next) => {
  const userId = req.baseUrl.split('/')[2]
  req.userId = userId

  console.log(`[DEBUG] userId: ${userId}`)

  const user = await User.findOne({ uid: userId }).lean()

  // if the uid does not match a registered user, deny announce
  if (!user) {
    const response = bencode.encode({
      'failure reason': 'Announce denied: you are not registered.',
    })
    res.send(response)
    return
  }

  // if the users email is not verified, deny announce
  if (!user.emailVerified) {
    const response = bencode.encode({
      'failure reason': 'Announce denied: email address must be verified.',
    })
    res.send(response)
    return
  }

  const q = req.url.split('?')[1]
  const params = qs.parse(q, { decoder: unescape })

  const infoHash = binaryToHex(params.info_hash)

  console.log(`[DEBUG] query: ${JSON.stringify(params)}`)
  console.log(`[DEBUG] infoHash: ${infoHash}`)

  const torrent = await Torrent.findOne({ infoHash }).lean()

  // if torrent info hash is not in the database, deny announce
  if (!torrent) {
    const response = bencode.encode({
      'failure reason':
        'Announce denied: cannot announce a torrent that has not been uploaded.',
    })
    res.send(response)
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
    const response = bencode.encode({
      'failure reason': `Announce denied: Ratio is below minimum threshold ${process.env.SQ_MINIMUM_RATIO}.`,
      peers: [],
    })
    res.send(response)
    return
  }

  /*
    Bonus points: determine how much the user has uploaded, and whether or not this announce will take their total
    uploaded amount into the next whole GiB. If so, increment the users bonus points by the configured amount.
  */

  const [sumUploaded] = await Progress.aggregate([
    {
      $match: {
        userId: user._id,
      },
    },
    {
      $group: {
        _id: 'uploaded',
        bytes: { $sum: '$uploaded.total' },
      },
    },
  ])

  const { bytes } = sumUploaded ?? { bytes: 0 }
  const nextGb = Math.max(Math.ceil(bytes / BYTES_GB), 1)

  const prevProgressRecord = await Progress.findOne({
    userId: user._id,
    infoHash,
  }).lean()

  const alreadyUploadedSession = prevProgressRecord?.uploaded?.session ?? 0
  const uploadDeltaSession = params.uploaded - alreadyUploadedSession

  const alreadyDownloadedSession = prevProgressRecord?.downloaded?.session ?? 0
  const downloadDeltaSession = params.downloaded - alreadyDownloadedSession

  if ((bytes + uploadDeltaSession) / BYTES_GB >= nextGb) {
    await User.findOneAndUpdate(
      { _id: user._id },
      { $inc: { bonusPoints: process.env.SQ_BP_PER_GB } }
    )
  }

  console.log({
    bytes,
    uploaded: params.uploaded,
    alreadyUploadedSession,
    uploadDeltaSession,
    downloaded: params.downloaded,
    alreadyDownloadedSession,
    downloadDeltaSession,
  })

  // update the progress report for this user/torrent pair

  if (params.uploaded !== prevProgressRecord?.uploaded?.session) {
    await Progress.findOneAndUpdate(
      { userId: user._id, infoHash },
      {
        $set: {
          userId: user._id,
          infoHash,
          uploaded: {
            session: params.uploaded,
            total:
              (prevProgressRecord?.uploaded?.total ?? 0) + uploadDeltaSession,
          },
          left: params.left,
        },
      },
      { upsert: true }
    )
  }

  if (params.downloaded !== prevProgressRecord?.downloaded?.session) {
    await Progress.findOneAndUpdate(
      { userId: user._id, infoHash },
      {
        $set: {
          userId: user._id,
          infoHash,
          downloaded: {
            session:
              torrent.freeleech || process.env.SQ_SITE_WIDE_FREELEECH === true
                ? prevProgressRecord?.downloaded?.session ?? 0
                : params.downloaded,
            total:
              torrent.freeleech || process.env.SQ_SITE_WIDE_FREELEECH === true
                ? prevProgressRecord?.downloaded?.total ?? 0
                : (prevProgressRecord?.downloaded?.total ?? 0) +
                downloadDeltaSession,
          }
          left: params.left,
        },
      },
      { upsert: true }
    )
  }

  next()
}

export default handleAnnounce

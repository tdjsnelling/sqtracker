import bencode from 'bencode'
import crypto from 'crypto'
import fetch from 'node-fetch'
import mongoose from 'mongoose'
import Torrent from '../schema/torrent'
import User from '../schema/user'
import Comment from '../schema/comment'
import { hexToBinary } from '../middleware/announce'

export const uploadTorrent = async (req, res) => {
  if (
    req.body.torrent &&
    req.body.name &&
    req.body.description &&
    req.body.type
  ) {
    try {
      const torrent = Buffer.from(req.body.torrent, 'base64')
      const parsed = bencode.decode(torrent)

      if (parsed.info.private !== 1) {
        res.status(400).send('Torrent must be set to private')
        return
      }

      if (!parsed.announce || parsed['announce-list']) {
        res.status(400).send('One and only one announce URL must be set')
        return
      }

      const user = await User.findOne({ _id: req.userId }).lean()

      if (
        parsed.announce.toString() !==
        `${process.env.SQ_BASE_URL}/sq/${user.uid}/announce`
      ) {
        res.status(400).send('Announce URL is invalid')
        return
      }

      const infoHash = crypto
        .createHash('sha1')
        .update(bencode.encode(parsed.info))
        .digest('hex')

      const existingTorrent = await Torrent.findOne({ infoHash }).lean()

      if (existingTorrent) {
        res.status(409).send('Torrent with this info hash already exists')
        return
      }

      const newTorrent = new Torrent({
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        infoHash: infoHash,
        binary: req.body.torrent,
        uploadedBy: req.userId,
        downloads: 0,
        anonymous: false,
        size:
          parsed.info.length ||
          parsed.info.files.reduce((acc, cur) => {
            return acc + cur.length
          }, 0),
        created: Date.now(),
        upvotes: [],
        downvotes: [],
      })

      await newTorrent.save()

      res.status(200).send(infoHash)
    } catch (e) {
      res.status(500).send(e.message)
    }
  } else {
    res.status(400).send('Form is incomplete')
  }
}

export const downloadTorrent = async (req, res) => {
  const { infoHash } = req.params

  const user = await User.findOne({ _id: req.userId }).lean()

  if (!user) {
    res.status(401).send(`User does not exist`)
    return
  }

  const torrent = await Torrent.findOne({ infoHash }).lean()
  const { binary } = torrent
  const parsed = bencode.decode(Buffer.from(binary, 'base64'))

  parsed.announce = `${process.env.SQ_BASE_URL}/sq/${user.uid}/announce`

  await Torrent.findOneAndUpdate({ infoHash }, { $inc: { downloads: 1 } })

  res.setHeader('Content-Type', 'application/x-bittorrent')
  res.setHeader(
    'Content-Disposition',
    `attachment;filename=${parsed.info.name.toString()}.torrent`
  )
  res.write(bencode.encode(parsed))
  res.end()
}

export const fetchTorrent = async (req, res) => {
  const { infoHash } = req.params

  try {
    const [torrent] = await Torrent.aggregate([
      {
        $match: { infoHash },
      },
      {
        $project: {
          name: 1,
          description: 1,
          type: 1,
          infoHash: 1,
          uploadedBy: 1,
          downloads: 1,
          anonymous: 1,
          size: 1,
          created: 1,
          upvotes: { $size: '$upvotes' },
          downvotes: { $size: '$downvotes' },
          userHasUpvoted: { $in: [req.userId, '$upvotes'] },
          userHasDownvoted: { $in: [req.userId, '$downvotes'] },
        },
      },
      {
        $lookup: {
          from: 'users',
          as: 'uploadedBy',
          let: { userId: '$uploadedBy' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
            {
              $project: {
                username: 1,
                created: 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: '$uploadedBy', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'comments',
          as: 'comments',
          let: { torrentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$torrentId', '$$torrentId'] },
              },
            },
            {
              $lookup: {
                from: 'users',
                as: 'user',
                let: { userId: '$userId' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$_id', '$$userId'] },
                    },
                  },
                  {
                    $project: {
                      username: 1,
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: '$user',
                preserveNullAndEmptyArrays: true,
              },
            },
            { $sort: { created: -1 } },
          ],
        },
      },
    ])

    if (!torrent) {
      res.status(404).send(`Torrent with info hash ${infoHash} does not exist`)
      return
    }

    if (torrent.anonymous) delete torrent.uploadedBy

    const binaryInfoHash = hexToBinary(infoHash)
    const encodedInfoHash = escape(binaryInfoHash)

    const trackerRes = await fetch(
      `${process.env.SQ_TRACKER_URL}/scrape?info_hash=${encodedInfoHash}`
    )

    if (!trackerRes.ok) {
      const body = await trackerRes.text()
      res
        .status(500)
        .send(`Error performing tracker scrape: ${trackerRes.status} ${body}`)
      return
    }

    const bencoded = await trackerRes.arrayBuffer()
    const scrape = bencode.decode(bencoded)
    const scrapeForInfoHash =
      scrape.files[Buffer.from(binaryInfoHash, 'binary')]

    res.json({
      ...torrent,
      seeders: scrapeForInfoHash?.complete || 0,
      leechers: scrapeForInfoHash?.incomplete || 0,
    })
  } catch (e) {
    console.error(e)
    res.status(500).send(e.message)
  }
}

export const getTorrentsPage = async ({
  skip = 0,
  limit = 25,
  query,
  category,
  userId,
}) => {
  const torrents = await Torrent.aggregate([
    {
      $project: {
        infoHash: 1,
        name: 1,
        description: 1,
        type: 1,
        downloads: 1,
        uploadedBy: 1,
        created: 1,
      },
    },
    ...(query
      ? [
          {
            $match: {
              $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
              ],
            },
          },
        ]
      : []),
    ...(category
      ? [
          {
            $match: {
              type: category,
            },
          },
        ]
      : []),
    ...(userId
      ? [
          {
            $match: {
              uploadedBy: userId,
            },
          },
        ]
      : []),
    {
      $sort: { created: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: 'comments',
        as: 'comments',
        let: { torrentId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$torrentId', '$$torrentId'] } } },
          { $count: 'count' },
        ],
      },
    },
    {
      $unwind: {
        path: '$comments',
        preserveNullAndEmptyArrays: true,
      },
    },
  ])

  let q = ''
  torrents.forEach((torrent, i) => {
    q += `${i === 0 ? '?' : '&'}info_hash=${escape(
      hexToBinary(torrent.infoHash)
    )}`
  })

  const trackerRes = await fetch(`${process.env.SQ_TRACKER_URL}/scrape${q}`)

  if (!trackerRes.ok) {
    const body = await trackerRes.text()
    throw new Error(
      `Error performing tracker scrape: ${trackerRes.status} ${body}`
    )
  }

  const bencoded = await trackerRes.arrayBuffer()
  const scrape = bencode.decode(bencoded)

  const torrentsWithScrape = torrents.map((torrent) => {
    const scrapeForInfoHash =
      scrape.files[Buffer.from(hexToBinary(torrent.infoHash), 'binary')]
    return {
      ...torrent,
      seeders: scrapeForInfoHash?.complete || 0,
      leechers: scrapeForInfoHash?.incomplete || 0,
    }
  })

  return torrentsWithScrape
}

export const addComment = async (req, res) => {
  if (req.body.comment) {
    try {
      const { infoHash } = req.params

      const torrent = await Torrent.findOne({ infoHash }).lean()

      if (!torrent) {
        res.status(404).send('Torrent does not exist')
        return
      }

      const comment = new Comment({
        torrentId: torrent._id,
        userId: req.userId,
        comment: req.body.comment,
        created: Date.now(),
      })
      await comment.save()

      res.sendStatus(200)
    } catch (err) {
      res.status(500).send(err.message)
    }
  } else {
    res.sendStatus(400)
  }
}

export const listLatest = async (req, res) => {
  let { count } = req.query
  count = parseInt(count) || 20
  count = Math.min(count, 100)
  try {
    const torrents = await getTorrentsPage({ limit: count })
    res.json(torrents)
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const searchTorrents = async (req, res) => {
  const { query, category, page } = req.query
  try {
    const torrents = await getTorrentsPage({
      skip: page || 0,
      limit: 25,
      query,
      category,
    })
    res.json(torrents)
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const addVote = async (req, res) => {
  const { infoHash, vote } = req.params
  try {
    const torrent = await Torrent.findOne({ infoHash }).lean()

    if (!torrent) {
      res.sendStatus(404)
      return
    }

    if (vote === 'up' || vote === 'down') {
      await Torrent.findOneAndUpdate(
        { infoHash },
        {
          $addToSet: {
            [vote === 'up' ? 'upvotes' : 'downvotes']: mongoose.Types.ObjectId(
              req.userId
            ),
          },
          $pull: {
            [vote === 'down' ? 'upvotes' : 'downvotes']:
              mongoose.Types.ObjectId(req.userId),
          },
        }
      )
      res.sendStatus(200)
    } else {
      res.status(400).send('Vote must be one of (up, down)')
    }
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const removeVote = async (req, res) => {
  const { infoHash, vote } = req.params
  try {
    const torrent = await Torrent.findOne({ infoHash }).lean()

    if (!torrent) {
      res.sendStatus(404)
      return
    }

    if (vote === 'up' || vote === 'down') {
      await Torrent.findOneAndUpdate(
        { infoHash },
        {
          $pull: {
            [vote === 'up' ? 'upvotes' : 'downvotes']: mongoose.Types.ObjectId(
              req.userId
            ),
          },
        }
      )
      res.sendStatus(200)
    } else {
      res.status(400).send('Vote must be one of (up, down)')
    }
  } catch (e) {
    res.status(500).send(e.message)
  }
}

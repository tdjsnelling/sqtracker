import bencode from 'bencode'
import crypto from 'crypto'
import fetch from 'node-fetch'
import Torrent from '../schema/torrent'
import User from '../schema/user'
import { hexToBinary } from '../middleware/announce'

export const uploadTorrent = async (req, res) => {
  if (req.body.torrent && req.body.name && req.body.description) {
    try {
      const torrent = Buffer.from(req.body.torrent, 'base64')
      const parsed = bencode.decode(torrent)

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
        infoHash: infoHash,
        binary: req.body.torrent,
      })

      await newTorrent.save()

      res.status(200).send(infoHash)
    } catch (e) {
      res.status(500).send(e.message)
    }
  } else {
    res.sendStatus(400)
  }
}

export const downloadTorrent = async (req, res) => {
  const { infoHash } = req.params
  const { uid } = req.query

  if (!uid) {
    res.status(401).send('Missing user ID')
    return
  }

  const user = await User.findOne({ uid }).lean()

  if (!user) {
    res.status(401).send(`User ID "${uid}" does not exist`)
    return
  }

  const torrent = await Torrent.findOne({ infoHash }).lean()
  const { binary } = torrent
  const parsed = bencode.decode(Buffer.from(binary, 'base64'))

  parsed.announce = `${process.env.SQ_BASE_URL}/sq/${uid}/announce`

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
    const torrent = await Torrent.findOne({ infoHash }).lean()

    if (!torrent) {
      res.status(404).send(`Torrent with info hash ${infoHash} does not exist`)
      return
    }

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

    const bencoded = await trackerRes.text()
    const scrape = bencode.decode(Buffer.from(bencoded, 'binary'))
    const scrapeForInfoHash =
      scrape.files[Buffer.from(binaryInfoHash, 'binary')]

    res.json({
      ...torrent,
      seeders: scrapeForInfoHash?.complete,
      leechers: scrapeForInfoHash?.incomplete,
    })
  } catch (e) {
    res.status(500).send(e.message)
  }
}

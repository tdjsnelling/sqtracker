import bencode from 'bencode'
import crypto from 'crypto'
import Torrent from '../schema/torrent'
import User from '../schema/user'

export const uploadTorrent = async (req, res) => {
  if (req.body.torrent && req.body.name && req.body.description) {
    try {
      const torrent = Buffer.from(req.body.torrent, 'binary')
      const parsed = bencode.decode(torrent)

      const infoHash = crypto
        .createHash('sha1')
        .update(bencode.encode(parsed.info))
        .digest('hex')

      const existingTorrent = Torrent.findOne({ infoHash })

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

  const user = await User.findOne({ uid })

  if (!user) {
    res.status(401).send(`User ID "${uid}" does not exist`)
    return
  }

  const torrent = await Torrent.findOne({ infoHash })
  const { binary } = torrent
  const parsed = bencode.decode(Buffer.from(binary, 'binary'))

  parsed.announce = `${process.env.SQ_BASE_URL}/tracker/${uid}/announce`

  res.setHeader('Content-Type', 'application/x-bittorrent')
  res.setHeader(
    'Content-Disposition',
    `attachment;filename=${parsed.info.name.toString()}.torrent`
  )
  res.write(bencode.encode(parsed))
  res.end()
}

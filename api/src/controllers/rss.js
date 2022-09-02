import bcrypt from 'bcrypt'
import User from '../schema/user'
import Torrent from '../schema/torrent'
import { hexToBinary } from '../middleware/announce'
import fetch from 'node-fetch'
import bencode from 'bencode'

// prettier-ignore
const getTorrentXml = (torrent, userId) => {
  const announceUrl = `${process.env.SQ_BASE_URL}/sq/${userId}/announce`
  return `<item>
      <title>${torrent.name}</title>
      <description>${torrent.description}</description>
      <guid>${torrent.infoHash}</guid>
      <enclosure url="${process.env.SQ_API_URL}/torrent/download/${torrent.infoHash}/${userId}" type="application/x-bittorrent" />
      <torrent>
        <filename>${torrent.name}</filename>
        <contentlength>${torrent.size}</contentlength>
        <magneturi>magnet:?xt=urn:btih:${torrent.infoHash}&dn=${encodeURIComponent(torrent.name)}&tr=${encodeURIComponent(announceUrl)}</magneturi>
        <trackers>
          <group order="ordered">
            <tracker seeds="${torrent.seeders}" peers="${torrent.seeders + torrent.leechers}">
              ${announceUrl}
            </tracker>
          </group>
        </trackers>
      </torrent>
    </item>`
}

export const rssFeed = async (req, res) => {
  const { 'x-sq-username': username, 'x-sq-password': password } = req.headers
  const { query } = req.query

  try {
    const user = await User.findOne({ username })

    if (!user) {
      res.status(404).send('Incorrect login details')
      return
    }

    const matches = await bcrypt.compare(password, user.password)

    if (!matches) {
      res.status(401).send('Incorrect login details')
      return
    }

    let torrents
    if (query) {
      torrents = await Torrent.find(
        {
          $or: [
            { name: { $regex: decodeURIComponent(query), $options: 'i' } },
            {
              description: { $regex: decodeURIComponent(query), $options: 'i' },
            },
          ],
        },
        null,
        { sort: { created: -1 }, limit: 100 }
      ).lean()
    } else {
      torrents = await Torrent.find({}, null, {
        sort: { created: -1 },
        limit: 100,
      }).lean()
    }

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

    const torrentsXml = torrentsWithScrape
      .map((t) => getTorrentXml(t, user.uid))
      .join('\n')

    res.setHeader('Content-Type', 'text/xml')
    res.status(200).send(`<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>${process.env.SQ_SITE_NAME}: ${query ? 'results' : 'latest'}</title>
    <link>${process.env.SQ_BASE_URL}</link>
    ${torrentsXml}
  </channel>
</rss>`)
  } catch (err) {
    res.status(500).send(err.message)
  }
}

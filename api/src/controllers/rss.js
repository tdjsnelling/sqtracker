import bcrypt from "bcrypt";
import User from "../schema/user";
import Torrent from "../schema/torrent";
import { embellishTorrentsWithTrackerScrape } from "./torrent";

// prettier-ignore
const getTorrentXml = (torrent, userId) => {
  return `<item>
      <title>${torrent.name}</title>
      <description>${torrent.description}</description>
      <guid>${torrent.infoHash}</guid>
      <enclosure url="${process.env.SQ_API_URL}/torrent/download/${torrent.infoHash}/${userId}" type="application/x-bittorrent" />
      <torrent>
        <filename>${torrent.name}</filename>
        <contentlength>${torrent.size}</contentlength>
        <trackers>
          <group order="ordered">
            <tracker seeds="${torrent.seeders}" peers="${torrent.seeders + torrent.leechers}">
              ${process.env.SQ_BASE_URL}/sq/${userId}/announce
            </tracker>
          </group>
        </trackers>
      </torrent>
    </item>`
}

export const rssFeed = (tracker) => async (req, res, next) => {
  const { username, password } = req.cookies;
  const { query } = req.query;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      res.status(401).send("Incorrect login details");
      return;
    }

    const matches = await bcrypt.compare(password, user.password);

    if (!matches) {
      res.status(401).send("Incorrect login details");
      return;
    }

    let torrents;
    if (query) {
      torrents = await Torrent.find(
        {
          $or: [
            { name: { $regex: decodeURIComponent(query), $options: "i" } },
            {
              description: { $regex: decodeURIComponent(query), $options: "i" },
            },
          ],
        },
        null,
        { sort: { created: -1 }, limit: 100 }
      ).lean();
    } else {
      torrents = await Torrent.find({}, null, {
        sort: { created: -1 },
        limit: 100,
      }).lean();
    }

    const torrentsWithScrape = await embellishTorrentsWithTrackerScrape(
      tracker,
      torrents
    );

    const torrentsXml = torrentsWithScrape
      .map((t) => getTorrentXml(t, user.uid))
      .join("\n");

    res.setHeader("Content-Type", "text/xml");
    res.status(200).send(`<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>${process.env.SQ_SITE_NAME}: ${query ? "results" : "latest"}</title>
    <link>${process.env.SQ_BASE_URL}</link>
    ${torrentsXml}
  </channel>
</rss>`);
  } catch (e) {
    next(e);
  }
};

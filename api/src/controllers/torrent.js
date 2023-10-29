import bencode from "bencode";
import crypto from "crypto";
import mongoose from "mongoose";
import { createNGrams, nGrams } from "mongoose-fuzzy-searching/helpers";
import slugify from "slugify";
import contentDisposition from "content-disposition";
import Torrent from "../schema/torrent";
import User from "../schema/user";
import Comment from "../schema/comment";
import Group from "../schema/group";
import { createGroup, addToGroup, removeFromGroup } from "./group";

const urlReservedCharRegex = /[&$+,/:;=?@#<>\[\]{}|\\\^%]/g;

const formatTag = (tag) =>
  tag
    .trim()
    .toLowerCase()
    .replaceAll(urlReservedCharRegex, "")
    .replaceAll(" ", "-");

export const embellishTorrentsWithTrackerScrape = async (tracker, torrents) => {
  if (!torrents.length) return [];

  try {
    return torrents.map((torrent) => {
      const torrentFromTracker = tracker.torrents[torrent.infoHash];
      return {
        ...torrent,
        seeders: torrentFromTracker?.complete || 0,
        leechers: torrentFromTracker?.incomplete || 0,
      };
    });
  } catch (e) {
    console.error("[DEBUG] Error: could not embellish torrents from tracker");
    return torrents;
  }
};

export const uploadTorrent = async (req, res, next) => {
  if (req.body.torrent && req.body.name && req.body.description) {
    try {
      const torrent = Buffer.from(req.body.torrent, "base64");
      const parsed = bencode.decode(torrent);

      if (process.env.SQ_TORRENT_CATEGORIES.length && !req.body.type) {
        res.status(400).send("Torrent must have a category");
        return;
      }

      if (process.env.SQ_TORRENT_CATEGORIES.length) {
        const sources =
          process.env.SQ_TORRENT_CATEGORIES[
            Object.keys(process.env.SQ_TORRENT_CATEGORIES).find(
              (cat) => slugify(cat, { lower: true }) === req.body.type
            )
          ];
        if (
          !sources
            .map((source) => slugify(source, { lower: true }))
            .includes(req.body.source)
        ) {
          res.status(400).send("Torrent must have a source");
          return;
        }
      }

      const user = await User.findOne({ _id: req.userId }).lean();

      parsed.info.private = 1;
      parsed.announce = `${process.env.SQ_BASE_URL}/sq/${user.uid}/announce`;
      delete parsed["announce-list"];

      const infoHash = crypto
        .createHash("sha1")
        .update(bencode.encode(parsed.info))
        .digest("hex");

      const existingTorrent = await Torrent.findOne({ infoHash }).lean();

      if (existingTorrent) {
        res.status(409).send("Torrent with this info hash already exists");
        return;
      }

      let files;
      if (parsed.info.files) {
        files = parsed.info.files.map((file) => ({
          path: file.path.map((tok) => tok.toString()).join("/"),
          size: file.length,
        }));
      } else {
        files = [
          {
            path: parsed.info.name.toString(),
            size: parsed.info.length,
          },
        ];
      }

      const hasBlackListedFiles = files.some((file) =>
        (process.env.SQ_EXTENSION_BLACKLIST ?? []).some((ext) =>
          file.path.endsWith(`.${ext}`)
        )
      );

      if (hasBlackListedFiles) {
        res
          .status(403)
          .send("One or more files have blacklisted file extensions");
        return;
      }

      let groupId;

      if (req.body.groupWith) {
        const groupWithTorrent = await Torrent.findOne({
          infoHash: req.body.groupWith,
        }).lean();

        if (!groupWithTorrent) {
          res.status(400).send("Cannot group with torrent that does not exist");
          return;
        }

        groupId = groupWithTorrent.group;

        if (!groupId) {
          groupId = await createGroup([groupWithTorrent]);
        }
      }

      const newTorrent = new Torrent({
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        source: req.body.source,
        infoHash,
        binary: req.body.torrent,
        poster: req.body.poster,
        uploadedBy: req.userId,
        downloads: 0,
        anonymous: false,
        size:
          parsed.info.length ||
          parsed.info.files.reduce((acc, cur) => {
            return acc + cur.length;
          }, 0),
        files,
        created: Date.now(),
        upvotes: [],
        downvotes: [],
        freeleech: false,
        tags: (req.body.tags ?? "").split(",").map((t) => formatTag(t)),
        group: groupId,
        mediaInfo: req.body.mediaInfo,
      });
      await newTorrent.save();

      if (groupId) await addToGroup(groupId, infoHash);

      res.status(200).send(infoHash);
    } catch (e) {
      next(e);
    }
  } else {
    res.status(400).send("Form is incomplete");
  }
};

export const editTorrent = async (req, res, next) => {
  if (req.body.name && req.body.type && req.body.description) {
    try {
      const { infoHash } = req.params;

      const torrent = await Torrent.findOne({
        infoHash,
      }).lean();

      if (!torrent) {
        res
          .status(404)
          .send(`Torrent with info hash ${infoHash} does not exist`);
        return;
      }

      if (
        req.userRole !== "admin" &&
        req.userId.toString() !== torrent.uploadedBy.toString()
      ) {
        res.status(403).send("You do not have permission to edit this torrent");
        return;
      }

      if (process.env.SQ_TORRENT_CATEGORIES.length) {
        const sources =
          process.env.SQ_TORRENT_CATEGORIES[
            Object.keys(process.env.SQ_TORRENT_CATEGORIES).find(
              (cat) => slugify(cat, { lower: true }) === req.body.type
            )
          ];
        if (
          !sources
            .map((source) => slugify(source, { lower: true }))
            .includes(req.body.source)
        ) {
          res.status(400).send("Torrent must have a source");
          return;
        }
      }

      const clone = { ...torrent, name: req.body.name };
      createNGrams(clone, ["name"]);

      await Torrent.findOneAndUpdate(
        { infoHash },
        {
          $set: {
            name: req.body.name,
            name_fuzzy: clone.name_fuzzy,
            type: req.body.type,
            source: req.body.source,
            description: req.body.description,
            tags: (req.body.tags ?? "").split(",").map((t) => formatTag(t)),
          },
          mediaInfo: req.body.mediaInfo,
        }
      );

      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  } else {
    res.status(400).send("Form is incomplete");
  }
};

export const downloadTorrent = async (req, res, next) => {
  try {
    const { infoHash, userId } = req.params;

    const user = await User.findOne({ uid: userId }).lean();

    if (!user) {
      res.status(401).send(`User does not exist`);
      return;
    }

    const torrent = await Torrent.findOne({ infoHash }).lean();
    const { binary } = torrent;
    const parsed = bencode.decode(Buffer.from(binary, "base64"));

    parsed.announce = `${process.env.SQ_BASE_URL}/sq/${user.uid}/announce`;
    delete parsed["announce-list"];
    parsed.info.private = 1;

    const fileName = `${parsed.info.name.toString()} - ${
      process.env.SQ_SITE_NAME
    }.torrent`;

    res.setHeader("Content-Type", "application/x-bittorrent");
    res.setHeader("Content-Disposition", contentDisposition(fileName));

    res.write(bencode.encode(parsed));
    res.end();
  } catch (e) {
    next(e);
  }
};

export const fetchTorrent = (tracker) => async (req, res, next) => {
  const { infoHash } = req.params;

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
          source: 1,
          infoHash: 1,
          uploadedBy: 1,
          downloads: 1,
          anonymous: 1,
          poster: 1,
          size: 1,
          files: 1,
          created: 1,
          upvotes: { $size: "$upvotes" },
          downvotes: { $size: "$downvotes" },
          userHasUpvoted: { $in: [req.userId, "$upvotes"] },
          userHasDownvoted: { $in: [req.userId, "$downvotes"] },
          freeleech: 1,
          tags: 1,
          group: 1,
          mediaInfo: 1,
        },
      },
      {
        $lookup: {
          from: "users",
          as: "uploadedBy",
          let: { userId: "$uploadedBy" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
            {
              $project: {
                username: 1,
                created: 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: "$uploadedBy", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          as: "fetchedBy",
          let: { torrentId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", req.userId] } } },
            {
              $project: {
                bookmarks: 1,
              },
            },
            {
              $addFields: {
                bookmarked: { $in: ["$$torrentId", "$bookmarks"] },
              },
            },
            {
              $project: {
                bookmarked: 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: "$fetchedBy", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "comments",
          as: "comments",
          let: { parentId: "$_id" },
          pipeline: [
            {
              $match: {
                type: "torrent",
                $expr: { $eq: ["$parentId", "$$parentId"] },
              },
            },
            {
              $lookup: {
                from: "users",
                as: "user",
                let: { userId: "$userId" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$userId"] },
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
                path: "$user",
                preserveNullAndEmptyArrays: true,
              },
            },
            { $sort: { created: -1 } },
          ],
        },
      },
    ]);

    if (!torrent) {
      res.status(404).send(`Torrent with info hash ${infoHash} does not exist`);
      return;
    }

    if (torrent.anonymous) delete torrent.uploadedBy;

    const [embellishedTorrent] = await embellishTorrentsWithTrackerScrape(
      tracker,
      [torrent]
    );

    let groupTorrents = [];
    if (embellishedTorrent.group) {
      const group = await Group.findOne({
        _id: embellishedTorrent.group,
      }).lean();

      if (group) {
        const otherIds = group.torrents.filter(
          (id) => id.toString() !== embellishedTorrent._id.toString()
        );
        groupTorrents = await Torrent.find(
          { _id: { $in: otherIds } },
          { name: 1, infoHash: 1, freeleech: 1, type: 1, created: 1 },
          { sort: { created: -1 } }
        ).lean();
        groupTorrents = await embellishTorrentsWithTrackerScrape(
          tracker,
          groupTorrents
        );
      }
    }

    res.json({ ...embellishedTorrent, groupTorrents });
  } catch (e) {
    next(e);
  }
};

export const deleteTorrent = async (req, res, next) => {
  try {
    const torrent = await Torrent.findOne({
      infoHash: req.params.infoHash,
    }).lean();

    if (!torrent) {
      res.status(404).send("Torrent could not be found");
      return;
    }

    if (
      req.userRole !== "admin" &&
      req.userId.toString() !== torrent.uploadedBy.toString()
    ) {
      res.status(403).send("You do not have permission to delete this torrent");
      return;
    }

    if (torrent.group) {
      await removeFromGroup(torrent.group, torrent.infoHash);
    }

    await Torrent.deleteOne({ infoHash: req.params.infoHash });

    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};

export const getTorrentsPage = async ({
  skip = 0,
  limit = 25,
  ids,
  query,
  category,
  source,
  tag,
  uploadedBy,
  userId,
  sort,
  tracker,
}) => {
  const queryNGrams = nGrams(query, false, 2, false).join(" ");

  const [sortField, sortDirString] = sort?.split(":") ?? [];
  const sortDir = sortDirString === "asc" ? 1 : -1;

  const combinedSort = {};
  if (sortField) combinedSort[sortField] = sortDir;
  if (query) combinedSort.confidenceScore = { $meta: "textScore" };
  if (!combinedSort.created) combinedSort.created = -1;

  const torrents = await Torrent.aggregate([
    ...(query
      ? [
          {
            $match: {
              $text: {
                $search: queryNGrams,
              },
            },
          },
          {
            $addFields: { confidenceScore: { $meta: "textScore" } },
          },
        ]
      : []),
    {
      $project: {
        infoHash: 1,
        name: 1,
        description: 1,
        type: 1,
        source: 1,
        downloads: 1,
        uploadedBy: 1,
        created: 1,
        freeleech: 1,
        tags: 1,
        confidenceScore: 1,
      },
    },
    ...(Array.isArray(ids)
      ? [
          {
            $match: { $expr: { $in: ["$_id", ids] } },
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
    ...(source
      ? [
          {
            $match: {
              source,
            },
          },
        ]
      : []),
    ...(tag
      ? [
          {
            $match: {
              $expr: { $in: [tag, "$tags"] },
            },
          },
        ]
      : []),
    ...(uploadedBy
      ? [
          {
            $match: {
              uploadedBy,
            },
          },
        ]
      : []),
    {
      $lookup: {
        from: "comments",
        as: "comments",
        let: { parentId: "$_id" },
        pipeline: [
          {
            $match: {
              type: "torrent",
              $expr: { $eq: ["$parentId", "$$parentId"] },
            },
          },
          { $count: "count" },
        ],
      },
    },
    {
      $unwind: {
        path: "$comments",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        as: "fetchedBy",
        let: { torrentId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", userId] } } },
          {
            $project: {
              bookmarks: 1,
            },
          },
          {
            $addFields: {
              bookmarked: { $in: ["$$torrentId", "$bookmarks"] },
            },
          },
          {
            $project: {
              bookmarked: 1,
            },
          },
        ],
      },
    },
    { $unwind: { path: "$fetchedBy", preserveNullAndEmptyArrays: true } },
    {
      $sort: combinedSort,
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  const [count] = await Torrent.aggregate([
    ...(query
      ? [
          {
            $match: {
              $text: {
                $search: queryNGrams,
              },
            },
          },
        ]
      : []),
    ...(Array.isArray(ids)
      ? [
          {
            $match: { expr: { $in: ["$_id", ids] } },
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
    ...(source
      ? [
          {
            $match: {
              source,
            },
          },
        ]
      : []),
    ...(tag
      ? [
          {
            $match: {
              $expr: { $in: [tag, "$tags"] },
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
      $count: "total",
    },
  ]);

  return {
    torrents: await embellishTorrentsWithTrackerScrape(tracker, torrents),
    total: count?.total ?? torrents.length,
  };
};

export const listLatest = (tracker) => async (req, res, next) => {
  let { count } = req.query;
  count = parseInt(count) || 25;
  count = Math.min(count, 100);
  try {
    const { torrents } = await getTorrentsPage({
      limit: count,
      userId: req.userId,
      tracker,
    });
    res.json(torrents);
  } catch (e) {
    next(e);
  }
};

export const listAll = async (req, res, next) => {
  try {
    const torrents = await Torrent.find({}, { infoHash: 1 }).lean();
    res.json(torrents);
  } catch (e) {
    next(e);
  }
};

export const searchTorrents = (tracker) => async (req, res, next) => {
  const { query, category, source, tag, page, sort } = req.query;
  try {
    const torrents = await getTorrentsPage({
      skip: page ? parseInt(page) : 0,
      query: query ? decodeURIComponent(query) : undefined,
      category,
      source,
      tag: tag ? decodeURIComponent(tag) : undefined,
      userId: req.userId,
      sort: sort ? decodeURIComponent(sort) : undefined,
      tracker,
    });
    res.json(torrents);
  } catch (e) {
    next(e);
  }
};

export const addComment = async (req, res, next) => {
  if (req.body.comment) {
    try {
      const { infoHash } = req.params;

      const torrent = await Torrent.findOne({ infoHash }).lean();

      if (!torrent) {
        res.status(404).send("Torrent does not exist");
        return;
      }

      const comment = new Comment({
        type: "torrent",
        parentId: torrent._id,
        userId: req.userId,
        comment: req.body.comment,
        created: Date.now(),
      });
      await comment.save();

      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  } else {
    res.status(400).send("Request must include comment");
  }
};

export const addVote = async (req, res, next) => {
  const { infoHash, vote } = req.params;
  try {
    const torrent = await Torrent.findOne({ infoHash }).lean();

    if (!torrent) {
      res.status(404).send("Torrent could not be found");
      return;
    }

    if (vote === "up" || vote === "down") {
      await Torrent.findOneAndUpdate(
        { infoHash },
        {
          $addToSet: {
            [vote === "up" ? "upvotes" : "downvotes"]: mongoose.Types.ObjectId(
              req.userId
            ),
          },
          $pull: {
            [vote === "down" ? "upvotes" : "downvotes"]:
              mongoose.Types.ObjectId(req.userId),
          },
        }
      );
      res.sendStatus(200);
    } else {
      res.status(400).send("Vote must be one of up, down");
    }
  } catch (e) {
    next(e);
  }
};

export const removeVote = async (req, res, next) => {
  const { infoHash, vote } = req.params;
  try {
    const torrent = await Torrent.findOne({ infoHash }).lean();

    if (!torrent) {
      res.status(404).send("Torrent could not be found");
      return;
    }

    if (vote === "up" || vote === "down") {
      await Torrent.findOneAndUpdate(
        { infoHash },
        {
          $pull: {
            [vote === "up" ? "upvotes" : "downvotes"]: mongoose.Types.ObjectId(
              req.userId
            ),
          },
        }
      );
      res.sendStatus(200);
    } else {
      res.status(400).send("Vote must be one of (up, down)");
    }
  } catch (e) {
    next(e);
  }
};

export const toggleFreeleech = async (req, res, next) => {
  const { infoHash } = req.params;
  try {
    if (req.userRole !== "admin") {
      res.status(401).send("You do not have permission to toggle freeleech");
      return;
    }

    const torrent = await Torrent.findOne({ infoHash }).lean();

    if (!torrent) {
      res.status(404).send("Torrent could not be found");
      return;
    }

    await Torrent.findOneAndUpdate(
      { infoHash },
      { $set: { freeleech: !torrent.freeleech } }
    );
    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};

export const toggleBookmark = async (req, res, next) => {
  const { infoHash } = req.params;
  try {
    const torrent = await Torrent.findOne({ infoHash }).lean();

    if (!torrent) {
      res.status(404).send("Torrent could not be found");
      return;
    }

    const user = await User.findOne({ _id: req.userId }).lean();

    const isBookmarked = (await user.bookmarks?.length)
      ? user.bookmarks.map((b) => b.toString()).includes(torrent._id.toString())
      : false;

    await User.findOneAndUpdate(
      { _id: req.userId },
      { [isBookmarked ? "$pull" : "$addToSet"]: { bookmarks: torrent._id } }
    );
    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};

export const listTags = async (req, res, next) => {
  try {
    const torrents = await Torrent.find(
      { tags: { $exists: true, $not: { $size: 0 } } },
      { tags: 1 }
    ).lean();

    const uniqueTags = new Set();

    for (const { tags } of torrents) {
      for (const tag of tags) {
        if (tag !== "") uniqueTags.add(tag);
      }
    }

    res.json(Array.from(uniqueTags));
  } catch (e) {
    next(e);
  }
};

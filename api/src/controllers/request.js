import Request from "../schema/request";
import Comment from "../schema/comment";
import Torrent from "../schema/torrent";
import User from "../schema/user";

export const createRequest = async (req, res, next) => {
  if (req.body.title && req.body.body) {
    try {
      const existing = await Request.countDocuments();

      const index = existing + 1;

      const request = new Request({
        index,
        title: req.body.title,
        body: req.body.body,
        createdBy: req.userId,
        created: Date.now(),
        candidates: [],
      });

      await request.save();
      res.send({ index });
    } catch (e) {
      next(e);
    }
  } else {
    res.status(400).send("Request must include title and body");
  }
};

export const getRequests = async (req, res, next) => {
  const pageSize = 25;
  try {
    let { page } = req.query;
    page = parseInt(page) || 0;

    const requests = await Request.aggregate([
      {
        $sort: { created: -1 },
      },
      {
        $skip: page * pageSize,
      },
      {
        $limit: pageSize,
      },
      {
        $lookup: {
          from: "users",
          as: "createdBy",
          let: { userId: "$createdBy" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$_id", "$$userId"] } },
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
        $project: {
          body: 0,
        },
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    res.json(requests);
  } catch (e) {
    next(e);
  }
};

export const fetchRequest = async (req, res, next) => {
  try {
    const [request] = await Request.aggregate([
      {
        $match: { index: parseInt(req.params.index) },
      },
      {
        $lookup: {
          from: "users",
          as: "createdBy",
          let: { userId: "$createdBy" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$_id", "$$userId"] } },
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
          path: "$createdBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "comments",
          as: "comments",
          let: { parentId: "$_id" },
          pipeline: [
            {
              $match: {
                type: "request",
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
      {
        $lookup: {
          from: "torrents",
          as: "candidates",
          let: { torrentIds: "$candidates.torrent" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$torrentIds"] } } },
            {
              $project: {
                infoHash: 1,
                name: 1,
                type: 1,
                created: 1,
              },
            },
            {
              $unwind: {
                path: "$candidates",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
        },
      },
    ]);
    if (!request) {
      res.status(404).send("Request could not be found");
      return;
    }
    res.send(request);
  } catch (e) {
    console.error(e);
    next(e);
  }
};

export const deleteRequest = async (req, res, next) => {
  try {
    const request = await Request.findOne({
      index: parseInt(req.params.index),
    }).lean();

    if (req.userId.toString() !== request.createdBy.toString()) {
      res.status(401).send("You do not have permission to delete that request");
      return;
    }

    await Request.deleteOne({ index: parseInt(req.params.index) });
    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};

export const addComment = async (req, res, next) => {
  if (req.body.comment) {
    try {
      const request = await Request.findOne({
        _id: req.params.requestId,
      }).lean();

      if (!request) {
        res.status(404).send("Request does not exist");
        return;
      }

      const comment = new Comment({
        type: "request",
        parentId: request._id,
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

export const addCandidate = async (req, res, next) => {
  if (req.body.infoHash) {
    try {
      const request = await Request.findOne({
        _id: req.params.requestId,
      }).lean();

      const torrent = await Torrent.findOne(
        {
          infoHash: req.body.infoHash,
        },
        { infoHash: 1, name: 1, type: 1, created: 1 }
      ).lean();

      if (!torrent) {
        res.status(404).send("Torrent does not exist");
        return;
      }

      if (
        request.candidates
          .map((c) => c.torrent?.toString())
          .includes(torrent._id.toString())
      ) {
        res.status(409).send("Torrent has already been suggested");
        return;
      }

      await Request.findOneAndUpdate(
        { _id: req.params.requestId },
        {
          $addToSet: {
            candidates: { torrent: torrent._id, suggestedBy: req.userId },
          },
        }
      );

      res.status(200).send({ torrent });
    } catch (e) {
      next(e);
    }
  } else {
    res.status(400).send("Request must include infoHash");
  }
};

export const acceptCandidate = async (req, res, next) => {
  if (req.body.infoHash) {
    try {
      const request = await Request.findOne({
        _id: req.params.requestId,
      }).lean();

      if (req.userId.toString() !== request.createdBy.toString()) {
        res
          .status(401)
          .send("You do not have permission to accept that suggestion");
        return;
      }

      const torrent = await Torrent.findOne({
        infoHash: req.body.infoHash,
      }).lean();

      const candidate = request.candidates.find(
        (c) => c.torrent?.toString() === torrent._id.toString()
      );

      if (!candidate) {
        res
          .status(403)
          .send("Cannot accept a torrent that has not been suggested");
        return;
      }

      await Request.findOneAndUpdate(
        { _id: req.params.requestId },
        { $set: { fulfilledBy: torrent._id } }
      );

      await User.findOneAndUpdate(
        { _id: candidate.suggestedBy },
        {
          $inc: {
            bonusPoints:
              process.env.SQ_BP_EARNED_PER_FILLED_REQUEST *
              (torrent.uploadedBy.toString() ===
              candidate.suggestedBy.toString()
                ? 2
                : 1),
          },
        }
      );

      res.status(200).send({ torrent: torrent._id });
    } catch (e) {
      next(e);
    }
  } else {
    res.status(400).send("Request must include infoHash");
  }
};

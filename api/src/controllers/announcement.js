import slugify from "slugify";
import Announcement from "../schema/announcement";
import Comment from "../schema/comment";

export const createAnnouncement = async (req, res, next) => {
  if (req.body.title && req.body.body) {
    try {
      if (req.userRole !== "admin") {
        res
          .status(401)
          .send("You do not have permission to create an announcement");
        return;
      }

      const slug = slugify(req.body.title).toLowerCase();

      const existing = await Announcement.findOne({ slug }).lean();

      if (existing) {
        res
          .status(409)
          .send(
            "Announcement with this slug already exists. Please change the title."
          );
        return;
      }

      const announcement = new Announcement({
        title: req.body.title,
        slug,
        body: req.body.body,
        createdBy: req.userId,
        pinned: !!req.body.pinned,
        allowComments: !!req.body.allowComments,
        created: Date.now(),
      });

      await announcement.save();
      res.send(slug);
    } catch (e) {
      next(e);
    }
  } else {
    res.status(400).send("Request must include title and body");
  }
};

export const fetchAnnouncement = async (req, res, next) => {
  try {
    const [announcement] = await Announcement.aggregate([
      {
        $match: { slug: req.params.slug },
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
                type: "announcement",
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
    if (!announcement) {
      res.status(404).send("Announcement could not be found");
      return;
    }
    res.send(announcement);
  } catch (e) {
    next(e);
  }
};

export const getAnnouncements = async (req, res, next) => {
  try {
    let { page, count } = req.query;
    page = parseInt(page) || 0;
    count = parseInt(count) || 25;
    count = Math.min(count, 100);

    const announcements = await Announcement.aggregate([
      {
        $match: { pinned: { $not: { $eq: true } } },
      },
      {
        $sort: { created: -1 },
      },
      {
        $skip: page * count,
      },
      {
        $limit: count,
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
    res.json(announcements);
  } catch (e) {
    next(e);
  }
};

export const getPinnedAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.aggregate([
      {
        $match: { pinned: true },
      },
      {
        $sort: { created: -1 },
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
    res.json(announcements);
  } catch (e) {
    next(e);
  }
};

export const getLatestAnnouncement = async (req, res, next) => {
  try {
    const [announcement] = await Announcement.aggregate([
      {
        $sort: { created: -1 },
      },
      {
        $limit: 1,
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
    ]);
    if (announcement) res.json(announcement);
    else res.sendStatus(404);
  } catch (e) {
    next(e);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    if (req.userRole !== "admin") {
      res
        .status(401)
        .send("You do not have permission to delete an announcement");
      return;
    }

    await Announcement.deleteOne({ slug: req.params.slug });
    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};

export const pinAnnouncement = async (req, res, next) => {
  try {
    await Announcement.findOneAndUpdate(
      { _id: req.params.announcementId },
      { $set: { pinned: req.params.action === "pin" } }
    );
    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};

export const editAnnouncement = async (req, res, next) => {
  if (req.body.title && req.body.body) {
    try {
      if (req.userRole !== "admin") {
        res
          .status(401)
          .send("You do not have permission to edit an announcement");
        return;
      }

      const announcement = await Announcement.findOneAndUpdate(
        { _id: req.params.announcementId },
        {
          $set: {
            title: req.body.title,
            body: req.body.body,
            pinned: !!req.body.pinned,
            allowComments: !!req.body.allowComments,
            updated: Date.now(),
          },
        }
      );

      res.send(announcement.slug);
    } catch (e) {
      next(e);
    }
  } else {
    res.status(400).send("Request must include title and body");
  }
};

export const addComment = async (req, res, next) => {
  if (req.body.comment) {
    try {
      const announcement = await Announcement.findOne({
        _id: req.params.announcementId,
      }).lean();

      if (!announcement) {
        res.status(404).send("Announcement does not exist");
        return;
      }

      if (!announcement.allowComments) {
        res.status(403).send("Commenting is disabled on this announcement");
        return;
      }

      const comment = new Comment({
        type: "announcement",
        parentId: announcement._id,
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

import slugify from 'slugify'
import Announcement from '../schema/announcement'

export const createAnnouncement = async (req, res) => {
  if (req.body.title && req.body.body) {
    try {
      if (req.userRole !== 'admin') {
        res
          .status(401)
          .send('You do not have permission to create an announcement')
        return
      }

      const slug = slugify(req.body.title).toLowerCase()

      const existing = await Announcement.findOne({ slug }).lean()

      if (existing) {
        res
          .status(409)
          .send(
            'Announcement with this slug already exists. Please change the title.'
          )
        return
      }

      const announcement = new Announcement({
        title: req.body.title,
        slug,
        body: req.body.body,
        createdBy: req.userId,
        pinned: req.body.pinned,
        created: Date.now(),
      })

      await announcement.save()
      res.send(slug)
    } catch (e) {
      res.status(500).send(e.message)
    }
  } else {
    res.status(400).send('Request must include title and body')
  }
}

export const fetchAnnouncement = async (req, res) => {
  try {
    const [announcement] = await Announcement.aggregate([
      {
        $match: { slug: req.params.slug },
      },
      {
        $lookup: {
          from: 'users',
          as: 'createdBy',
          let: { userId: '$createdBy' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$userId'] } },
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
          path: '$createdBy',
          preserveNullAndEmptyArrays: true,
        },
      },
    ])
    if (!announcement) {
      res.status(404).send('Announcement could not be found')
      return
    }
    res.send(announcement)
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const getAnnouncements = async (req, res) => {
  const pageSize = 25
  try {
    let { page } = req.query
    page = parseInt(page) || 0

    const announcements = await Announcement.aggregate([
      {
        $match: { pinned: { $not: { $eq: true } } },
      },
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
          from: 'users',
          as: 'createdBy',
          let: { userId: '$createdBy' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$userId'] } },
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
          path: '$createdBy',
          preserveNullAndEmptyArrays: true,
        },
      },
    ])
    res.json(announcements)
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const getPinnedAnnouncements = async (req, res) => {
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
          from: 'users',
          as: 'createdBy',
          let: { userId: '$createdBy' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$userId'] } },
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
          path: '$createdBy',
          preserveNullAndEmptyArrays: true,
        },
      },
    ])
    res.json(announcements)
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const deleteAnnouncement = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      res
        .status(401)
        .send('You do not have permission to delete an announcement')
      return
    }

    await Announcement.deleteOne({ slug: req.params.slug })
    res.sendStatus(200)
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const pinAnnouncement = async (req, res) => {
  try {
    await Announcement.findOneAndUpdate(
      { _id: req.params.announcementId },
      { $set: { pinned: req.params.action === 'pin' } }
    )
    res.sendStatus(200)
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const editAnnouncement = async (req, res) => {
  if (req.body.title && req.body.body) {
    try {
      if (req.userRole !== 'admin') {
        res
          .status(401)
          .send('You do not have permission to edit an announcement')
        return
      }

      const announcement = await Announcement.findOneAndUpdate(
        { _id: req.params.announcementId },
        {
          $set: {
            title: req.body.title,
            body: req.body.body,
            pinned: req.body.pinned,
            updated: Date.now(),
          },
        }
      )

      res.send(announcement.slug)
    } catch (e) {
      res.status(500).send(e.message)
    }
  } else {
    res.status(400).send('Request must include title and body')
  }
}

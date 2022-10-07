import Request from '../schema/request'
import Comment from '../schema/comment'

export const createRequest = async (req, res) => {
  if (req.body.title && req.body.body) {
    try {
      const existing = await Request.countDocuments()

      const index = existing + 1

      const request = new Request({
        index,
        title: req.body.title,
        body: req.body.body,
        createdBy: req.userId,
        created: Date.now(),
        candidates: [],
      })

      await request.save()
      res.send({ index })
    } catch (e) {
      res.status(500).send(e.message)
    }
  } else {
    res.status(400).send('Request must include title and body')
  }
}

export const getRequests = async (req, res) => {
  const pageSize = 25
  try {
    let { page } = req.query
    page = parseInt(page) || 0

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
    res.json(requests)
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const fetchRequest = async (req, res) => {
  try {
    const [request] = await Request.aggregate([
      {
        $match: { index: parseInt(req.params.index) },
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
      {
        $lookup: {
          from: 'comments',
          as: 'comments',
          let: { parentId: '$_id' },
          pipeline: [
            {
              $match: {
                type: 'request',
                $expr: { $eq: ['$parentId', '$$parentId'] },
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
    if (!request) {
      res.status(404).send('Request could not be found')
      return
    }
    res.send(request)
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findOne({
      index: parseInt(req.params.index),
    }).lean()

    if (req.userId.toString() !== request.createdBy.toString()) {
      res.status(401).send('You do not have permission to delete that request')
      return
    }

    await Request.deleteOne({ index: parseInt(req.params.index) })
    res.sendStatus(200)
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const addComment = async (req, res) => {
  if (req.body.comment) {
    try {
      const request = await Request.findOne({
        _id: req.params.requestId,
      }).lean()

      if (!request) {
        res.status(404).send('Request does not exist')
        return
      }

      const comment = new Comment({
        type: 'request',
        parentId: request._id,
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
    res.status(400).send('Request must include comment')
  }
}

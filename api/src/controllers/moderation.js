import Report from '../schema/report'
import Torrent from '../schema/torrent'
import User from '../schema/user'
import Progress from '../schema/progress'

export const createReport = async (req, res) => {
  if (req.body.reason) {
    try {
      const torrent = await Torrent.findOne({
        infoHash: req.params.infoHash,
      }).lean()

      if (!torrent) {
        res.status(404).send('Torrent with that info hash does not exist')
        return
      }

      const report = new Report({
        torrent: torrent._id,
        reportedBy: req.userId,
        reason: req.body.reason,
        solved: false,
        created: Date.now(),
      })

      await report.save()
      res.sendStatus(200)
    } catch (e) {
      res.status(500).send(e.message)
    }
  } else {
    res.status(400).send('Request must include reason')
  }
}

export const fetchReport = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      res.status(401).send('You do not have permission to view a report')
      return
    }

    const report = await Report.findOne({ _id: req.params.reportId }).lean()

    if (!report) {
      res.status(404).send('Report could not be found')
      return
    }

    report.reportedBy = await User.findOne({ _id: report.reportedBy }).select(
      'username created'
    )
    report.torrent = await Torrent.findOne({ _id: report.torrent }).select(
      'name description infoHash created'
    )

    res.json(report)
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const getReports = async (req, res) => {
  const pageSize = 25
  try {
    if (req.userRole !== 'admin') {
      res.status(401).send('You do not have permission to view reports')
      return
    }

    let { page } = req.query
    page = parseInt(page) || 0
    const reports = await Report.aggregate([
      {
        $match: { solved: false },
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
          as: 'reportedBy',
          let: { userId: '$reportedBy' },
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
        $lookup: {
          from: 'torrents',
          as: 'torrent',
          let: { torrentId: '$torrent' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$torrentId'] } },
            },
            {
              $project: {
                name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$reportedBy',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$torrent',
          preserveNullAndEmptyArrays: true,
        },
      },
    ])
    res.json(reports)
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const setReportResolved = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      res.status(401).send('You do not have permission to resolve a report')
      return
    }

    await Report.findOneAndUpdate(
      { _id: req.params.reportId },
      { $set: { solved: true } }
    )

    res.sendStatus(200)
  } catch (e) {
    res.status(500).send(e.message)
  }
}

export const getStats = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      res.status(401).send('You do not have permission to view tracker stats')
      return
    }

    const registeredUsers = await User.countDocuments()
    const bannedUsers = await User.countDocuments({ banned: true })
    const torrents = await Torrent.countDocuments()
    const completedDownloads = await Progress.countDocuments({ left: 0 })

    res.json({ registeredUsers, bannedUsers, torrents, completedDownloads })
  } catch (e) {
    res.status(500).send(e.message)
  }
}

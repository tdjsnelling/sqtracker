import Report from '../schema/report'
import Torrent from '../schema/torrent'

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
    res.sendStatus(400)
  }
}

export const fetchReport = async (req, res) => {}
export const listReports = async (req, res) => {}

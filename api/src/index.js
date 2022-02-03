import express from 'express'
import morgan from 'morgan'
import chalk from 'chalk'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import handleAnnounce from './middleware/announce'
import auth from './middleware/auth'
import { userTrackerRoutes, otherTrackerRoutes } from './routes/tracker'
import {
  register,
  login,
  generateInvite,
  fetchInvites,
  changePassword,
  initiatePasswordReset,
  finalisePasswordReset,
  fetchUser,
  getUserRole,
} from './controllers/user'
import {
  uploadTorrent,
  downloadTorrent,
  fetchTorrent,
  addComment,
  listLatest,
  searchTorrents,
  addVote,
  removeVote,
} from './controllers/torrent'
import {
  createAnnouncement,
  fetchAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} from './controllers/announcement'
import {
  createReport,
  fetchReport,
  getReports,
  setReportResolved,
} from './controllers/moderation'
import createAdminUser from './setup/createAdminUser'

const connectToDb = () => {
  console.log('[sq] initiating db connection...')
  mongoose
    .connect(process.env.SQ_MONGO_URL, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    })
    .catch((e) => {
      console.error(`[sq] error on initial db connection: ${e.message}`)
      setTimeout(connectToDb, 5000)
    })
}
connectToDb()

mongoose.connection.once('open', () => {
  console.log('[sq] connected to mongodb successfully')
  createAdminUser()
})

const app = express()
app.set('trust proxy', true)

const colorizeStatus = (status) => {
  if (!status) return '?'
  if (status.startsWith('2')) {
    return chalk.green(status)
  } else if (status.startsWith('4') || status.startsWith('5')) {
    return chalk.red(status)
  } else {
    return chalk.cyan(status)
  }
}

app.use(
  morgan((tokens, req, res) => {
    return [
      chalk.grey(new Date().toISOString()),
      chalk.yellow(tokens.method(req, res)),
      tokens.url(req, res),
      colorizeStatus(tokens.status(req, res)),
      `(${tokens['response-time'](req, res)} ms)`,
    ].join(' ')
  })
)

// custom logic implementing user tracking, ratio control etc
app.use('/sq/*/announce', handleAnnounce)

// proxy and manipulate tracker routes
app.use('/sq/*/announce', userTrackerRoutes)
app.use('/sq/*/scrape', userTrackerRoutes)
app.use('/stats', otherTrackerRoutes)

app.use(bodyParser.json())
app.use(cors())

// root
app.get('/', (req, res) =>
  res.send(`■ sqtracker running: ${process.env.SQ_SITE_NAME}`).status(200)
)

// auth routes
app.post('/register', register)
app.post('/login', login)
app.post('/reset-password/initiate', initiatePasswordReset)
app.post('/reset-password/finalise', finalisePasswordReset)

// everything from here on requires user auth
app.use(auth)

// user/account routes
app.get('/account/invites', fetchInvites)
app.get('/account/generate-invite', generateInvite)
app.post('/account/change-password', changePassword)
app.get('/account/get-role', getUserRole)
app.get('/user/:username', fetchUser)

// torrent routes
app.post('/torrent/upload', uploadTorrent)
app.get('/torrent/download/:infoHash', downloadTorrent)
app.get('/torrent/info/:infoHash', fetchTorrent)
app.post('/torrent/comment/:infoHash', addComment)
app.post('/torrent/vote/:infoHash/:vote', addVote)
app.post('/torrent/unvote/:infoHash/:vote', removeVote)
app.post('/torrent/report/:infoHash', createReport)
app.get('/torrents/latest', listLatest)
app.get('/torrents/search', searchTorrents)

// announcement routes
app.post('/announcements/new', createAnnouncement)
app.get('/announcements/:slug', fetchAnnouncement)
app.get('/announcements/page/:page', getAnnouncements)
app.delete('/announcements/:slug', deleteAnnouncement)

// moderation routes
app.get('/reports/page/:page', getReports)
app.post('/reports/resolve/:reportId', setReportResolved)
app.get('/reports/:reportId', fetchReport)

const port = process.env.SQ_PORT || 44444
app.listen(port, () => {
  console.log(`[sq] ■ sqtracker running http://localhost:${port}`)
})

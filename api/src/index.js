import express from 'express'
import morgan from 'morgan'
import chalk from 'chalk'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'
import config from '../../config'
import validateConfig from './utils/validateConfig'
import handleAnnounce from './middleware/announce'
import auth from './middleware/auth'
import {
  createUserTrackerRoutes,
  createOtherTrackerRoutes,
} from './routes/tracker'
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
  getUserVerifiedEmailStatus,
  verifyUserEmail,
  banUser,
  unbanUser,
  buyItems,
  generateTotpSecret,
  enableTotp,
  disableTotp,
} from './controllers/user'
import {
  uploadTorrent,
  downloadTorrent,
  fetchTorrent,
  deleteTorrent,
  addComment as addCommentTorrent,
  listLatest,
  searchTorrents,
  addVote,
  removeVote,
  toggleFreeleech,
} from './controllers/torrent'
import {
  createAnnouncement,
  fetchAnnouncement,
  getAnnouncements,
  getPinnedAnnouncements,
  deleteAnnouncement,
  pinAnnouncement,
  editAnnouncement,
  addComment as addCommentAnnouncement,
} from './controllers/announcement'
import {
  createReport,
  fetchReport,
  getReports,
  setReportResolved,
  getStats,
} from './controllers/moderation'
import { rssFeed } from './controllers/rss'
import {
  createRequest,
  getRequests,
  fetchRequest,
  deleteRequest,
  addComment as addCommentRequest,
  addCandidate,
  acceptCandidate,
} from './controllers/request'
import createAdminUser from './setup/createAdminUser'

let mail

validateConfig(config).then(() => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment:
        process.env.NODE_ENV === 'production' ? 'production' : 'development',
    })

    Sentry.setContext('deployment', {
      name: process.env.SQ_SITE_NAME,
      url: process.env.SQ_BASE_URL,
      adminEmail: process.env.SQ_ADMIN_EMAIL,
    })
  }

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

  mongoose.connection.once('open', async () => {
    console.log('[sq] connected to mongodb successfully')
    await createAdminUser()
  })

  mail = nodemailer.createTransport({
    host: process.env.SQ_SMTP_HOST,
    port: process.env.SQ_SMTP_PORT,
    secure: process.env.SQ_SMTP_SECURE,
    auth: {
      user: process.env.SQ_SMTP_USER,
      pass: process.env.SQ_SMTP_PASS,
    },
  })

  const app = express()
  app.set('trust proxy', true)
  app.disable('x-powered-by')

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
  const userTrackerRoutes = createUserTrackerRoutes()
  const otherTrackerRoutes = createOtherTrackerRoutes()
  app.use('/sq/*/announce', userTrackerRoutes)
  app.use('/sq/*/scrape', userTrackerRoutes)
  app.use('/stats', otherTrackerRoutes)

  app.use(bodyParser.json({ limit: '5mb' }))
  app.use(cookieParser())
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
  app.post('/verify-email', verifyUserEmail)

  // rss feed (auth handled in cookies)
  app.get('/rss', rssFeed)

  // torrent file download (can download without auth, will not be able to announce)
  app.get('/torrent/download/:infoHash/:userId', downloadTorrent)

  // everything from here on requires user auth
  app.use(auth)

  // user/account routes
  app.get('/account/invites', fetchInvites)
  app.post('/account/generate-invite', generateInvite)
  app.post('/account/change-password', changePassword)
  app.get('/account/get-role', getUserRole)
  app.get('/account/get-verified', getUserVerifiedEmailStatus)
  app.post('/account/buy', buyItems)
  app.get('/user/:username', fetchUser)
  app.post('/user/ban/:username', banUser)
  app.post('/user/unban/:username', unbanUser)
  app.get('/account/totp/generate', generateTotpSecret)
  app.post('/account/totp/enable', enableTotp)
  app.post('/account/totp/disable', disableTotp)

  // torrent routes
  app.post('/torrent/upload', uploadTorrent)
  app.get('/torrent/info/:infoHash', fetchTorrent)
  app.delete('/torrent/delete/:infoHash', deleteTorrent)
  app.post('/torrent/comment/:infoHash', addCommentTorrent)
  app.post('/torrent/vote/:infoHash/:vote', addVote)
  app.post('/torrent/unvote/:infoHash/:vote', removeVote)
  app.post('/torrent/report/:infoHash', createReport)
  app.post('/torrent/toggle-freeleech/:infoHash', toggleFreeleech)
  app.get('/torrents/latest', listLatest)
  app.get('/torrents/search', searchTorrents)

  // announcement routes
  app.post('/announcements/new', createAnnouncement)
  app.get('/announcements/pinned', getPinnedAnnouncements)
  app.get('/announcements/:slug', fetchAnnouncement)
  app.get('/announcements/page/:page', getAnnouncements)
  app.delete('/announcements/:slug', deleteAnnouncement)
  app.post('/announcements/pin/:announcementId/:action', pinAnnouncement)
  app.post('/announcements/edit/:announcementId', editAnnouncement)
  app.post('/announcements/comment/:announcementId', addCommentAnnouncement)

  // moderation routes
  app.get('/reports/page/:page', getReports)
  app.post('/reports/resolve/:reportId', setReportResolved)
  app.get('/reports/:reportId', fetchReport)
  app.get('/admin/stats', getStats)

  // request routes
  app.post('/requests/new', createRequest)
  app.get('/requests/page/:page', getRequests)
  app.get('/requests/:index', fetchRequest)
  app.delete('/requests/:index', deleteRequest)
  app.post('/requests/comment/:requestId', addCommentRequest)
  app.post('/requests/suggest/:requestId', addCandidate)
  app.post('/requests/accept/:requestId', acceptCandidate)

  const port = process.env.SQ_PORT || 3001
  app.listen(port, () => {
    console.log(`[sq] ■ sqtracker running http://localhost:${port}`)
  })
})

export { mail }

import express from 'express'
import morgan from 'morgan'
import chalk from 'chalk'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import handleAnnounce from './middleware/announce'
import auth from './middleware/auth'
import {
  register,
  login,
  generateInvite,
  changePassword,
  initiatePasswordReset,
  finalisePasswordReset,
} from './controllers/user'
import { userTrackerRoutes, otherTrackerRoutes } from './routes/tracker'
import {
  uploadTorrent,
  downloadTorrent,
  fetchTorrent,
} from './controllers/torrent'

dotenv.config()

const connectToDb = () => {
  console.log('initiating db connection...')
  mongoose
    .connect(process.env.SQ_MONGO_URL, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    })
    .catch((e) => {
      console.error(`error on initial db connection: ${e.message}`)
      setTimeout(connectToDb, 5000)
    })
}
connectToDb()

mongoose.connection.once('open', () => {
  console.log('connected to mongodb successfully')
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
app.use('/tracker/*/announce', handleAnnounce)

// proxy and manipulate tracker routes
app.use('/tracker/*/announce', userTrackerRoutes)
app.use('/tracker/*/scrape', userTrackerRoutes)
app.use('/stats', otherTrackerRoutes)

app.use(bodyParser.json())
app.use(cors())

// root
app.get('/', (req, res) => res.send('sqtracker running').status(200))

// auth routes
app.post('/register', register)
app.post('/login', login)
app.post('/reset-password/initiate', initiatePasswordReset)
app.post('/reset-password/finalise', finalisePasswordReset)

// everything from here on requires user auth
app.use(auth)

// user routes
app.get('/user/generate-invite', generateInvite)
app.post('/user/change-password', changePassword)

// torrent routes
app.post('/torrent/upload', uploadTorrent)
app.get('/torrent/download/:infoHash', downloadTorrent)
app.get('/torrent/info/:infoHash', fetchTorrent)

const port = process.env.SQ_PORT || 44444
app.listen(port, () => {
  console.log(`■ sqtracker running http://localhost:${port}`)
})

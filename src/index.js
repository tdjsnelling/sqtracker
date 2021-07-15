import express from 'express'
import morgan from 'morgan'
import chalk from 'chalk'
import dotenv from 'dotenv'
import { createProxyMiddleware } from 'http-proxy-middleware'
import mongoose from 'mongoose'
import { handleRequest } from './controllers/tracker'
import { register, login } from './controllers/user'

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

app.use('/tracker', (req, res, next) => {
  req.userId = req.path.split('/')[1]
  next()
})

app.use(
  '/tracker',
  createProxyMiddleware({
    target: process.env.SQ_TRACKER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/tracker/(.*)/': '',
    },
    onProxyReq: (proxyReq, req) => {
      if (req.path === 'announce') handleRequest(req)
    },
  })
)

// root
app.get('/', (req, res) => res.send('sqtracker running').status(200))

// auth routes
app.post('/register', register)
app.post('/login', login)

const port = process.env.SQ_PORT || 44444
app.listen(port, () => {
  console.log(`sqtracker running  http://localhost:${port}`)
})

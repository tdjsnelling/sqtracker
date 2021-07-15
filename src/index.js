import express from 'express'
import morgan from 'morgan'
import chalk from 'chalk'
import dotenv from 'dotenv'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { handleRequest } from './controllers/tracker'

dotenv.config()

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
    target: process.env.TRACKER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/tracker/(.*)/': '',
    },
    onProxyReq: (proxyReq, req) => {
      if (req.path === 'announce') handleRequest(req)
    },
  })
)

app.get('/', (req, res) => res.sendStatus(200))

const port = process.env.PORT || 44444
app.listen(port, () => {
  console.log(`tracker listening on port ${port}`)
})

import {
  createProxyMiddleware,
  responseInterceptor,
} from 'http-proxy-middleware'
import bencode from 'bencode'
import dotenv from 'dotenv'
import { handleAnnounce } from '../controllers/tracker'

dotenv.config()

export const announce = createProxyMiddleware({
  target: process.env.SQ_TRACKER_URL,
  changeOrigin: true,
  selfHandleResponse: true,
  pathRewrite: {
    '^/tracker/(.*)/': '',
  },
  onProxyReq: (proxyReq, req) => {
    if (req.path === 'announce') handleAnnounce(req)
  },
  onProxyRes: responseInterceptor(
    async (responseBuffer, proxyRes, req, res) => {
      const trackerResponse = bencode.decode(responseBuffer)
      const updatedResponse = {
        ...trackerResponse,
        interval: 30,
        'min interval': 30,
      }
      const bencoded = bencode.encode(updatedResponse)
      console.log(
        `[DEBUG] tracker response: ${JSON.stringify(updatedResponse, null, 2)}`
      )
      return bencoded
    }
  ),
})

export const otherTrackerRoutes = createProxyMiddleware({
  target: process.env.SQ_TRACKER_URL,
  changeOrigin: true,
})

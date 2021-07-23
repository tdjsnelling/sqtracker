import {
  createProxyMiddleware,
  responseInterceptor,
} from 'http-proxy-middleware'
import bencode from 'bencode'
import dotenv from 'dotenv'

dotenv.config()

export const userTrackerRoutes = createProxyMiddleware({
  target: process.env.SQ_TRACKER_URL,
  changeOrigin: true,
  selfHandleResponse: true,
  pathRewrite: {
    '^/tracker/(.*)/': '',
  },
  onProxyRes: responseInterceptor(async (responseBuffer) => {
    const trackerResponse = bencode.decode(responseBuffer)
    const updatedResponse = {
      ...trackerResponse,
      interval: 30,
      'min interval': 30,
    }
    const bencoded = bencode.encode(updatedResponse)
    console.log(`[DEBUG] tracker response: ${bencoded}`)
    return bencoded
  }),
})

export const otherTrackerRoutes = createProxyMiddleware({
  target: process.env.SQ_TRACKER_URL,
  changeOrigin: true,
})

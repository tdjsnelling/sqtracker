import {
  createProxyMiddleware,
  responseInterceptor,
} from 'http-proxy-middleware'
import bencode from 'bencode'

export const createUserTrackerRoutes = () =>
  createProxyMiddleware({
    target: process.env.SQ_TRACKER_URL,
    changeOrigin: true,
    selfHandleResponse: true,
    pathRewrite: {
      '^/sq/(.*)/': '',
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

export const createOtherTrackerRoutes = () =>
  createProxyMiddleware({
    target: process.env.SQ_TRACKER_URL,
    changeOrigin: true,
  })

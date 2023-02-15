import {
  createProxyMiddleware,
  responseInterceptor,
} from 'http-proxy-middleware'
import bencode from 'bencode'

export const createUserTrackerRoutes = () =>
  createProxyMiddleware({
    target: process.env.SQ_TRACKER_URL,
    xfwd: true,
    selfHandleResponse: true,
    pathRewrite: {
      '^/sq/(.*)/': '',
    },
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req) => {
      const trackerResponse = bencode.decode(responseBuffer)
      const updatedResponse = {
        ...trackerResponse,
      }
      if (req.path.includes('announce')) {
        updatedResponse['interval'] = 30
        updatedResponse['min interval'] = 30
      }
      const bencoded = bencode.encode(updatedResponse)
      console.log(`[DEBUG] tracker response: ${bencoded}`)
      return bencoded
    }),
  })

export const createOtherTrackerRoutes = () =>
  createProxyMiddleware({
    target: process.env.SQ_TRACKER_URL,
    xfwd: true,
  })

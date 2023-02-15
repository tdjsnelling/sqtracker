import {
  createProxyMiddleware,
  responseInterceptor,
} from 'http-proxy-middleware'
import bencode from 'bencode'
import qs from 'qs'

export const createUserTrackerRoutes = () =>
  createProxyMiddleware({
    target: process.env.SQ_TRACKER_URL,
    xfwd: true,
    changeOrigin: true,
    selfHandleResponse: true,
    pathRewrite: {
      '^/sq/(.*)/': '',
    },
    onProxyReq: (proxyReq, req, res) => {
      const ip = req.headers['x-forwarded-for'] || req.ip
      const [realIp] = ip.split(',').map((a) => a.trim())
      console.log(`[DEBUG] request from: ${ip}`)

      const [base, query] = req.url.split('?')

      const params = qs.parse(query, { decoder: unescape })
      params.ip = realIp

      console.log(params)

      proxyReq.url = `${base}?${qs.stringify(params, { encoder: escape })}`
      req.url = `${base}?${qs.stringify(params, { encoder: escape })}`

      console.log(proxyReq)
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
    changeOrigin: true,
  })

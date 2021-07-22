import {
  createProxyMiddleware,
  responseInterceptor,
} from 'http-proxy-middleware'
import dotenv from 'dotenv'
import {
  handleAnnounceRequest,
  handleAnnounceResponse,
} from '../controllers/tracker'

dotenv.config()

export const announce = createProxyMiddleware({
  target: process.env.SQ_TRACKER_URL,
  changeOrigin: true,
  selfHandleResponse: true,
  pathRewrite: {
    '^/tracker/(.*)/': '',
  },
  onProxyReq: (proxyReq, req) => {
    if (req.path === 'announce') handleAnnounceRequest(req)
  },
  onProxyRes: responseInterceptor(handleAnnounceResponse),
})

export const otherTrackerRoutes = createProxyMiddleware({
  target: process.env.SQ_TRACKER_URL,
  changeOrigin: true,
})

import express from 'express'
import {
  addComment as addCommentTorrent,
  addVote,
  deleteTorrent,
  fetchTorrent,
  listLatest,
  removeVote,
  searchTorrents,
  toggleFreeleech,
  uploadTorrent,
} from '../controllers/torrent'
import { createReport } from '../controllers/moderation'

const router = express.Router()

export default (tracker) => {
  router.post('/upload', uploadTorrent)
  router.get('/info/:infoHash', fetchTorrent(tracker))
  router.delete('/delete/:infoHash', deleteTorrent)
  router.post('/comment/:infoHash', addCommentTorrent)
  router.post('/vote/:infoHash/:vote', addVote)
  router.post('/unvote/:infoHash/:vote', removeVote)
  router.post('/report/:infoHash', createReport)
  router.post('/toggle-freeleech/:infoHash', toggleFreeleech)
  router.get('/latest', listLatest(tracker))
  router.get('/search', searchTorrents(tracker))
  return router
}

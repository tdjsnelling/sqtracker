import mongoose from 'mongoose'

const Torrent = new mongoose.Schema({
  infoHash: String,
  file: String,
  uploadedBy: String,
  name: String,
  description: String,
  downloads: Number,
  leechers: Number,
  seeders: Number,
  created: Number,
})

export default mongoose.model('torrent', Torrent)

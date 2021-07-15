import mongoose from 'mongoose'

const Torrent = new mongoose.Schema({
  infoHash: String,
  file: String,
  name: String,
  description: String,
  downloads: Number,
  leechers: Number,
  seeders: Number,
})

export default mongoose.model('torrent', Torrent)

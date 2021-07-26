import mongoose from 'mongoose'

const Torrent = new mongoose.Schema({
  infoHash: String,
  parsed: Object,
  binary: String,
  uploadedBy: String,
  name: String,
  description: String,
  image: String,
  downloads: Number,
  anonymous: Boolean,
  created: Number,
})

export default mongoose.model('torrent', Torrent)

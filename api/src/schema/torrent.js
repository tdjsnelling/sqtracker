import mongoose from 'mongoose'

const Torrent = new mongoose.Schema({
  infoHash: String,
  binary: String,
  uploadedBy: mongoose.Schema.ObjectId,
  name: String,
  description: String,
  type: String,
  image: String,
  downloads: Number,
  anonymous: Boolean,
  created: Number,
})

export default mongoose.model('torrent', Torrent)

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
  size: Number,
  created: Number,
  upvotes: Array,
  downvotes: Array,
})

export default mongoose.model('torrent', Torrent)

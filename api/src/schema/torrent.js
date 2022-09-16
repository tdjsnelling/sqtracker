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
  files: Array,
  created: Number,
  upvotes: Array,
  downvotes: Array,
  freeleech: Boolean,
})

export default mongoose.model('torrent', Torrent)

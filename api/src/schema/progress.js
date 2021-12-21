import mongoose from 'mongoose'

const Progress = new mongoose.Schema({
  infoHash: String,
  userId: mongoose.Schema.ObjectId,
  uploaded: Number,
  downloaded: Number,
  left: Number,
})

export default mongoose.model('progress', Progress)

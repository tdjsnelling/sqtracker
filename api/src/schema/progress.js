import mongoose from 'mongoose'

const Progress = new mongoose.Schema({
  infoHash: String,
  userId: String,
  uploaded: Number,
  downloaded: Number,
  left: Number,
})

export default mongoose.model('progress', Progress)

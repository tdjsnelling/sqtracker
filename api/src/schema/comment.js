import mongoose from 'mongoose'

const Comment = new mongoose.Schema({
  torrentId: mongoose.Schema.ObjectId,
  userId: mongoose.Schema.ObjectId,
  comment: String,
  created: Number,
})

export default mongoose.model('comment', Comment)

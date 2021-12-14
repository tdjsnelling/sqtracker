import mongoose from 'mongoose'

const Comment = new mongoose.Schema({
  torrentId: String,
  userId: String,
  comment: String,
  created: Number,
})

export default mongoose.model('comment', Comment)

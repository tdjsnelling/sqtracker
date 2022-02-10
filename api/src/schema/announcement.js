import mongoose from 'mongoose'

const Announcement = new mongoose.Schema({
  title: String,
  slug: String,
  body: String,
  createdBy: mongoose.Schema.ObjectId,
  pinned: Boolean,
  created: Number,
})

export default mongoose.model('announcement', Announcement)

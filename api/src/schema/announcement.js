import mongoose from 'mongoose'

const Announcement = new mongoose.Schema({
  title: String,
  slug: String,
  body: String,
  createdBy: mongoose.Schema.ObjectId,
  created: Number,
})

export default mongoose.model('announcement', Announcement)

import mongoose from 'mongoose'

const User = new mongoose.Schema({
  username: String,
  uid: String,
  downloaded: Object,
  uploaded: Object,
  created: Number,
})

export default mongoose.model('user', User)

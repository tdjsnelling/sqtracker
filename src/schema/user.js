import mongoose from 'mongoose'

const User = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  uid: String,
  torrents: Object,
  token: String,
  created: Number,
})

export default mongoose.model('user', User)

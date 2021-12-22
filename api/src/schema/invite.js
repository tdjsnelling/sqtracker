import mongoose from 'mongoose'

const Invite = new mongoose.Schema({
  invitingUser: mongoose.Schema.ObjectId,
  created: Number,
  validUntil: Number,
  claimed: Boolean,
  token: String,
})

export default mongoose.model('invite', Invite)

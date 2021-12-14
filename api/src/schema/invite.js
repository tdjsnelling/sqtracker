import mongoose from 'mongoose'

const Invite = new mongoose.Schema({
  invitingUser: String,
  created: Number,
  validUntil: Number,
  claimed: Boolean,
  token: String,
})

export default mongoose.model('invite', Invite)

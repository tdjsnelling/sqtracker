import mongoose from "mongoose";

const User = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  uid: String,
  torrents: Object,
  created: Number,
  banned: Boolean,
  role: String,
  invitedBy: mongoose.Schema.ObjectId,
  remainingInvites: Number,
  emailVerified: Boolean,
  bonusPoints: Number,
  totp: {
    enabled: Boolean,
    secret: String,
    qr: String,
    backup: [String],
  },
  bookmarks: [mongoose.Schema.ObjectId],
});

export default mongoose.model("user", User);

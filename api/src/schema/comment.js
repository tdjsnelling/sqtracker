import mongoose from "mongoose";

const Comment = new mongoose.Schema({
  type: String, // torrent|announcement
  parentId: mongoose.Schema.ObjectId,
  userId: mongoose.Schema.ObjectId,
  comment: String,
  created: Number,
});

export default mongoose.model("comment", Comment);

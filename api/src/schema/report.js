import mongoose from "mongoose";

const Report = new mongoose.Schema({
  torrent: mongoose.Schema.ObjectId,
  reportedBy: mongoose.Schema.ObjectId,
  reason: String,
  solved: Boolean,
  created: Number,
});

export default mongoose.model("report", Report);

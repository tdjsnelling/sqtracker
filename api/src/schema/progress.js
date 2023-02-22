import mongoose from "mongoose";

const Progress = new mongoose.Schema({
  infoHash: String,
  userId: mongoose.Schema.ObjectId,
  uploaded: {
    session: Number,
    total: Number,
  },
  downloaded: {
    session: Number,
    total: Number,
  },
  left: Number,
});

export default mongoose.model("progress", Progress);

import mongoose from "mongoose";

const Group = new mongoose.Schema({
  name: String,
  torrents: [mongoose.Schema.ObjectId],
});

export default mongoose.model("group", Group);

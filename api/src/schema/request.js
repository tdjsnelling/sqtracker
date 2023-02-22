import mongoose from "mongoose";

const Request = new mongoose.Schema({
  index: Number,
  title: String,
  body: String,
  createdBy: mongoose.Schema.ObjectId,
  created: Number,
  candidates: Array,
  fulfilledBy: mongoose.Schema.ObjectId,
});

export default mongoose.model("request", Request);

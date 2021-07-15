import mongoose from 'mongoose'

const Torrent = new mongoose.Schema({
  infoHash: String,
})

export default mongoose.model('torrent', Torrent)

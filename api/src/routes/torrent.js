import express from "express";
import {
  addComment as addCommentTorrent,
  addVote,
  deleteTorrent,
  fetchTorrent,
  listLatest,
  listAll,
  removeVote,
  searchTorrents,
  toggleFreeleech,
  uploadTorrent,
  editTorrent,
  toggleBookmark,
  listTags,
} from "../controllers/torrent";
import { createReport } from "../controllers/moderation";

const router = express.Router();

export default (tracker) => {
  router.post("/upload", uploadTorrent);
  router.get("/info/:infoHash", fetchTorrent(tracker));
  router.delete("/delete/:infoHash", deleteTorrent);
  router.post("/edit/:infoHash", editTorrent);
  router.post("/comment/:infoHash", addCommentTorrent);
  router.post("/vote/:infoHash/:vote", addVote);
  router.post("/unvote/:infoHash/:vote", removeVote);
  router.post("/report/:infoHash", createReport);
  router.post("/toggle-freeleech/:infoHash", toggleFreeleech);
  router.post("/bookmark/:infoHash", toggleBookmark);
  router.get("/latest", listLatest(tracker));
  router.get("/all", listAll);
  router.get("/search", searchTorrents(tracker));
  router.get("/tags", listTags);
  return router;
};

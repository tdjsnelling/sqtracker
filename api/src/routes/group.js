import express from "express";
import {
  removeTorrentFromGroup,
  findFuzzyGroupMatches,
} from "../controllers/group";

const router = express.Router();

export default () => {
  router.post("/remove/:infoHash", removeTorrentFromGroup);
  router.get("/search", findFuzzyGroupMatches);
  return router;
};

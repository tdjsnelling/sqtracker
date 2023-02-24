import express from "express";
import { removeTorrentFromGroup } from "../controllers/group";

const router = express.Router();

export default () => {
  router.post("/remove/:infoHash", removeTorrentFromGroup);
  return router;
};

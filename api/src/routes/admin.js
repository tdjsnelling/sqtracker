import express from "express";
import { getStats } from "../controllers/moderation";

const router = express.Router();

export default (tracker) => {
  router.get("/stats", getStats(tracker));
  return router;
};

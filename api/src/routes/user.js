import express from "express";
import { banUser, fetchUser, unbanUser } from "../controllers/user";

const router = express.Router();

export default (tracker) => {
  router.get("/:username", fetchUser(tracker));
  router.post("/ban/:username", banUser);
  router.post("/unban/:username", unbanUser);
  return router;
};

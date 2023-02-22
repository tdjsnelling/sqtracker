import express from "express";
import {
  addComment,
  createAnnouncement,
  deleteAnnouncement,
  editAnnouncement,
  fetchAnnouncement,
  getAnnouncements,
  getPinnedAnnouncements,
  pinAnnouncement,
  getLatestAnnouncement,
} from "../controllers/announcement";

const router = express.Router();

export default () => {
  router.post("/new", createAnnouncement);
  router.get("/pinned", getPinnedAnnouncements);
  router.get("/latest", getLatestAnnouncement);
  router.get("/:slug", fetchAnnouncement);
  router.get("/page/:page", getAnnouncements);
  router.delete("/:slug", deleteAnnouncement);
  router.post("/pin/:announcementId/:action", pinAnnouncement);
  router.post("/edit/:announcementId", editAnnouncement);
  router.post("/comment/:announcementId", addComment);
  return router;
};

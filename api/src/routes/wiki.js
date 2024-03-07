import express from "express";
import {
  createWiki,
  getWiki,
  getWikis,
  deleteWiki,
  updateWiki,
} from "../controllers/wiki";

const router = express.Router();

export default () => {
  router.post("/new", createWiki);
  router.post("/update/:wikiId", updateWiki);
  router.get("/", getWikis);
  router.get("*", getWiki);
  router.delete("*", deleteWiki);
  return router;
};

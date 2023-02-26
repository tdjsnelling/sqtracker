import express from "express";
import { createWiki, getWiki, deleteWiki } from "../controllers/wiki";

const router = express.Router();

export default () => {
  router.post("/new", createWiki);
  router.get("*", getWiki);
  router.delete("*", deleteWiki);
  return router;
};

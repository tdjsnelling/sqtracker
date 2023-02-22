import express from "express";
import {
  acceptCandidate,
  addCandidate,
  addComment as addCommentRequest,
  createRequest,
  deleteRequest,
  fetchRequest,
  getRequests,
} from "../controllers/request";

const router = express.Router();

export default () => {
  router.post("/new", createRequest);
  router.get("/page/:page", getRequests);
  router.get("/:index", fetchRequest);
  router.delete("/:index", deleteRequest);
  router.post("/comment/:requestId", addCommentRequest);
  router.post("/suggest/:requestId", addCandidate);
  router.post("/accept/:requestId", acceptCandidate);
  return router;
};

import express from "express";
import {
  fetchReport,
  getReports,
  setReportResolved,
} from "../controllers/moderation";

const router = express.Router();

export default () => {
  router.get("/page/:page", getReports);
  router.post("/resolve/:reportId", setReportResolved);
  router.get("/:reportId", fetchReport);
  return router;
};

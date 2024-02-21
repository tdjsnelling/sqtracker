import express from "express";
import morgan from "morgan";
import chalk from "chalk";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import ratelimit from "express-rate-limit";
import Tracker from "bittorrent-tracker";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import config from "../../config";
import validateConfig from "./utils/validateConfig";
import createTrackerRoute from "./tracker/routes";
import auth from "./middleware/auth";
import {
  accountRoutes,
  userRoutes,
  torrentRoutes,
  announcementRoutes,
  reportRoutes,
  adminRoutes,
  requestRoutes,
  groupRoutes,
  wikiRoutes,
} from "./routes";
import {
  register,
  login,
  initiatePasswordReset,
  finalisePasswordReset,
  verifyUserEmail,
} from "./controllers/user";
import { downloadTorrent } from "./controllers/torrent";
import { rssFeed } from "./controllers/rss";
import createAdminUser from "./setup/createAdminUser";

validateConfig(config).then(() => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment:
        process.env.NODE_ENV === "production" ? "production" : "development",
    });

    Sentry.setContext("deployment", {
      name: process.env.SQ_SITE_NAME,
      url: process.env.SQ_BASE_URL,
      adminEmail: process.env.SQ_ADMIN_EMAIL,
    });
  }

  let mail;

  if (!process.env.SQ_DISABLE_EMAIL) {
    mail = nodemailer.createTransport({
      host: process.env.SQ_SMTP_HOST,
      port: process.env.SQ_SMTP_PORT,
      secure: process.env.SQ_SMTP_SECURE,
      auth: {
        user: process.env.SQ_SMTP_USER,
        pass: process.env.SQ_SMTP_PASS,
      },
    });
  }

  const connectToDb = () => {
    console.log("[sq] initiating db connection...");
    mongoose
      .connect(process.env.SQ_MONGO_URL, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
        useCreateIndex: true,
      })
      .catch((e) => {
        console.error(`[sq] error on initial db connection: ${e.message}`);
        setTimeout(connectToDb, 5000);
      });
  };
  connectToDb();

  mongoose.connection.once("open", async () => {
    console.log("[sq] connected to mongodb successfully");
    await createAdminUser(mail);
  });

  const app = express();
  app.set("trust proxy", true);
  app.disable("x-powered-by");

  const colorizeStatus = (status) => {
    if (!status) return "?";
    if (status.startsWith("2")) {
      return chalk.green(status);
    } else if (status.startsWith("4") || status.startsWith("5")) {
      return chalk.red(status);
    } else {
      return chalk.cyan(status);
    }
  };

  app.use(
    morgan((tokens, req, res) => {
      return [
        chalk.grey(new Date().toISOString()),
        chalk.magenta(req.headers["x-forwarded-for"] ?? req.ip),
        chalk.yellow(tokens.method(req, res)),
        tokens.url(req, res),
        colorizeStatus(tokens.status(req, res)),
        `(${tokens["response-time"](req, res)} ms)`,
      ].join(" ");
    })
  );

  app.use(cors());

  // rate limit all API routes. if the request comes from Next SSR rather than
  // the client browser, we need to make use of the forwarded IP rather than
  // the origin of the request, as this will be the same for all users. to
  // prevent avoiding a client spoofing this to avoid the limit, we also verify
  // a secret only available to the server
  const limiter = ratelimit({
    windowMs: 1000 * 60,
    max: 120,
    keyGenerator: (req) => {
      if (
        req.headers["x-forwarded-for"] &&
        req.headers["x-sq-server-secret"] === process.env.SQ_SERVER_SECRET
      )
        return req.headers["x-forwarded-for"].split(",")[0];
      return req.ip;
    },
    skip: (req) => {
      return process.env.NODE_ENV !== "production" || req.method === "OPTIONS";
    },
  });
  app.use(limiter);

  const tracker = new Tracker.Server({
    http: false,
    udp: false,
    ws: false,
  });
  const onTrackerRequest = tracker._onRequest.bind(tracker);
  app.get("/sq/*/announce", createTrackerRoute("announce", onTrackerRequest));
  app.get("/sq/*/scrape", createTrackerRoute("scrape", onTrackerRequest));

  app.use(bodyParser.json({ limit: "5mb" }));
  app.use(cookieParser());

  app.get("/", (req, res) => {
    res.setHeader("Content-Type", "text/plain");
    res.send(`■ sqtracker running: ${process.env.SQ_SITE_NAME}`).status(200);
  });

  // auth routes
  app.post("/register", register(mail));
  app.post("/login", login);
  app.post("/reset-password/initiate", initiatePasswordReset(mail));
  app.post("/reset-password/finalise", finalisePasswordReset);
  app.post("/verify-email", verifyUserEmail);

  // rss feed (auth handled in cookies)
  app.get("/rss", rssFeed(tracker));

  // torrent file download (can download without auth, will not be able to announce)
  app.get("/torrent/download/:infoHash/:userId", downloadTorrent);

  // everything from here on requires user auth
  app.use(auth);

  app.use("/account", accountRoutes(tracker, mail));
  app.use("/user", userRoutes(tracker));
  app.use("/torrent", torrentRoutes(tracker));
  app.use("/announcements", announcementRoutes());
  app.use("/reports", reportRoutes());
  app.use("/admin", adminRoutes(tracker));
  app.use("/requests", requestRoutes());
  app.use("/group", groupRoutes());
  app.use("/wiki", wikiRoutes());

  app.use((err, req, res, next) => {
    console.error(`[sq] error in ${req.url}:`, err);
    res.status(500).send(`sqtracker API error: ${err}`);
  });

  const port = process.env.SQ_PORT || 3001;
  app.listen(port, () => {
    console.log(`[sq] ■ sqtracker running http://localhost:${port}`);
  });
});

import jwt from "jsonwebtoken";
import User from "../schema/user";

const auth = async (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.replace("Bearer ", "");
    try {
      const decoded = jwt.verify(token, process.env.SQ_JWT_SECRET);
      if (decoded) {
        const user = await User.findOne({ _id: decoded.id });
        if (user) {
          if (user.banned) {
            res.status(403).send("User is banned");
            return;
          }
          req.userId = user._id;
          req.userRole = user.role;
          next();
        } else {
          res.sendStatus(404);
        }
      } else {
        res.sendStatus(500);
      }
    } catch (err) {
      res.status(500).send(err);
    }
  } else if (
    req.headers["x-sq-public-access"] === "true" &&
    req.headers["x-sq-server-secret"] === process.env.SQ_SERVER_SECRET
  ) {
    next();
  } else {
    res.sendStatus(401);
  }
};

export default auth;

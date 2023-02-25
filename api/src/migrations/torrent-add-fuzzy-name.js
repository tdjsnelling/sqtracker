import mongoose from "mongoose";
import { createNGrams } from "mongoose-fuzzy-searching/helpers";
import Torrent from "../schema/torrent";
import config from "../../../config";

(async () => {
  await mongoose.connect(config.envs.SQ_MONGO_URL, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });

  console.log("[sq] connected to mongodb successfully");

  for await (const doc of Torrent.find()) {
    if (!doc.name_fuzzy?.some((n) => n !== "")) {
      createNGrams(doc, ["name"]);
      await Torrent.findByIdAndUpdate(doc._id, {
        $set: {
          name_fuzzy: doc.name_fuzzy,
        },
      });
    }
  }

  process.exit(0);
})();

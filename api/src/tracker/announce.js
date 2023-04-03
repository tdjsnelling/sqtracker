import qs from "qs";
import bencode from "bencode";
import User from "../schema/user";
import Torrent from "../schema/torrent";
import Progress from "../schema/progress";
import { getUserRatio } from "../utils/ratio";
import { getUserHitNRuns } from "../utils/hitnrun";

export const BYTES_GB = 1e9;

export const binaryToHex = (b) => Buffer.from(b, "binary").toString("hex");
export const hexToBinary = (h) => Buffer.from(h, "hex").toString("binary");

const handleAnnounce = async (req, res) => {
  const userId = req.originalUrl.split("/")[2];
  req.userId = userId;

  console.log(`[DEBUG] userId: ${userId}`);

  const user = await User.findOne({ uid: userId }).lean();

  // if the uid does not match a registered user, deny announce
  if (!user) {
    const response = bencode.encode({
      "failure reason": "Announce denied: you are not registered.",
    });
    res.send(response);
    return;
  }

  // if the users email is not verified, deny announce
  if (!user.emailVerified) {
    const response = bencode.encode({
      "failure reason": "Announce denied: email address must be verified.",
    });
    res.send(response);
    return;
  }

  const q = req.url.split("?")[1];
  const params = qs.parse(q, { decoder: unescape });

  const infoHash = binaryToHex(params.info_hash);

  console.log(`[DEBUG] query: ${JSON.stringify(params)}`);
  console.log(`[DEBUG] infoHash: ${infoHash}`);

  const torrent = await Torrent.findOne({ infoHash }).lean();

  // if torrent info hash is not in the database, deny announce
  if (!torrent) {
    const response = bencode.encode({
      "failure reason":
        "Announce denied: cannot announce a torrent that has not been uploaded.",
    });
    res.send(response);
    return;
  }

  const { ratio } = await getUserRatio(user._id);
  const hitnruns = await getUserHitNRuns(user._id);

  console.log(`[DEBUG] user ratio: ${ratio}`);
  console.log(`[DEBUG] user hit'n'runs: ${hitnruns}`);

  // if users ratio is below the minimum threshold, and they are trying to download, deny announce
  if (
    Number(process.env.SQ_MINIMUM_RATIO) !== -1 &&
    ratio < Number(process.env.SQ_MINIMUM_RATIO) &&
    ratio !== -1 &&
    Number(params.left > 0)
  ) {
    const response = bencode.encode({
      "failure reason": `Announce denied: Ratio is below minimum threshold ${process.env.SQ_MINIMUM_RATIO}.`,
      peers: [],
      peers6: [],
    });
    res.send(response);
    return;
  }

  // if user has committed more than the allowed number of hit'n'runs, and they are trying to download, deny announce
  if (
    Number(process.env.SQ_MAXIMUM_HIT_N_RUNS) !== -1 &&
    hitnruns >= Number(process.env.SQ_MAXIMUM_HIT_N_RUNS) &&
    Number(params.left > 0)
  ) {
    const response = bencode.encode({
      "failure reason": `Announce denied: You have committed ${process.env.SQ_MAXIMUM_HIT_N_RUNS} or more hit'n'runs.`,
      peers: [],
      peers6: [],
    });
    res.send(response);
    return;
  }

  const uploaded = Number(params.uploaded);
  const downloaded = params.event === "started" ? 0 : Number(params.downloaded);

  const prevProgressRecord = await Progress.findOne({
    userId: user._id,
    infoHash,
  }).lean();

  const alreadyUploadedSession = prevProgressRecord?.uploaded?.session ?? 0;
  const uploadDeltaSession =
    uploaded >= alreadyUploadedSession ? uploaded - alreadyUploadedSession : 0;

  const alreadyDownloadedSession = prevProgressRecord?.downloaded?.session ?? 0;
  const downloadDeltaSession =
    downloaded >= alreadyDownloadedSession
      ? downloaded - alreadyDownloadedSession
      : 0;

  const [sumUploaded] = await Progress.aggregate([
    {
      $match: {
        userId: user._id,
      },
    },
    {
      $group: {
        _id: "uploaded",
        bytes: { $sum: "$uploaded.total" },
      },
    },
  ]);

  const { bytes } = sumUploaded ?? { bytes: 0 };
  const nextGb = Math.max(Math.ceil((bytes + 1) / BYTES_GB), 1);
  const currentGb = nextGb - 1;

  const gbAfterUpload = Math.floor((bytes + uploadDeltaSession) / BYTES_GB);

  if (gbAfterUpload >= nextGb) {
    const deltaGb = gbAfterUpload - currentGb;
    await User.findOneAndUpdate(
      { _id: user._id },
      { $inc: { bonusPoints: deltaGb * process.env.SQ_BP_EARNED_PER_GB } }
    );
  }

  await Progress.findOneAndUpdate(
    { userId: user._id, infoHash },
    {
      $set: {
        userId: user._id,
        infoHash,
        uploaded: {
          session: uploaded,
          total:
            (prevProgressRecord?.uploaded?.total ?? 0) + uploadDeltaSession,
        },
        left: Number(params.left),
      },
    },
    { upsert: true }
  );

  await Progress.findOneAndUpdate(
    { userId: user._id, infoHash },
    {
      $set: {
        userId: user._id,
        infoHash,
        downloaded: {
          session:
            torrent.freeleech || process.env.SQ_SITE_WIDE_FREELEECH === true
              ? prevProgressRecord?.downloaded?.session ?? 0
              : downloaded,
          total:
            torrent.freeleech || process.env.SQ_SITE_WIDE_FREELEECH === true
              ? prevProgressRecord?.downloaded?.total ?? 0
              : (prevProgressRecord?.downloaded?.total ?? 0) +
                downloadDeltaSession,
        },
        left: Number(params.left),
      },
    },
    { upsert: true }
  );

  if (params.event === "completed") {
    await Torrent.findOneAndUpdate({ infoHash }, { $inc: { downloads: 1 } });
  }
};

export default handleAnnounce;

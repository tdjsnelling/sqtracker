import Group from "../schema/group";
import Torrent from "../schema/torrent";

export const createGroup = async (torrents) => {
  const group = new Group({
    name: torrents[0].name,
    torrents: torrents.map((t) => t._id),
    created: Date.now(),
  });
  await group.save();

  for (const torrent of torrents) {
    await Torrent.findOneAndUpdate(
      { _id: torrent._id },
      { $set: { group: group._id } }
    );
  }

  return group._id;
};

export const addToGroup = async (groupId, infoHash) => {
  const group = await Group.findOne({ _id: groupId }).lean();

  if (!group) throw "Group does not exist";

  const torrent = await Torrent.findOne({
    infoHash,
  }).lean();

  if (!torrent) throw "Torrent does not exist";

  await Group.findOneAndUpdate(
    { _id: groupId },
    { $addToSet: { torrents: torrent._id } }
  );
};

export const removeFromGroup = async (groupId, infoHash) => {
  const group = await Group.findOne({ _id: groupId }).lean();

  if (!group) throw "Group does not exist";

  const torrent = await Torrent.findOne({
    infoHash,
  }).lean();

  if (!torrent) throw "Torrent does not exist";

  if (
    !group.torrents.map((id) => id.toString()).includes(torrent._id.toString())
  )
    throw "Torrent is not a member of group";

  if (group.torrents.length > 1) {
    await Group.findOneAndUpdate(
      { _id: groupId },
      { $pull: { torrents: torrent._id } }
    );
  } else {
    await Group.deleteOne({ _id: groupId });
  }

  await Torrent.findOneAndUpdate(
    {
      infoHash,
    },
    { $set: { group: null } }
  );
};

export const removeTorrentFromGroup = async (req, res, next) => {
  try {
    const torrent = await Torrent.findOne({
      infoHash: req.params.infoHash,
    }).lean();

    if (!torrent) {
      res.status(404).send("Torrent could not be found");
      return;
    }

    if (
      req.userRole !== "admin" &&
      req.userId.toString() !== torrent.uploadedBy.toString()
    ) {
      res
        .status(403)
        .send(
          "You do not have permission to remove this torrent from the group"
        );
      return;
    }

    if (!torrent.group) {
      res.status(400).send("Torrent does not have a group");
      return;
    }

    await removeFromGroup(torrent.group, torrent.infoHash);

    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};

export const findFuzzyGroupMatches = async (req, res, next) => {
  try {
    let { query } = req.query;
    query = query ? decodeURIComponent(query) : undefined;

    if (!query || query.length < 2) {
      res.status(400).send("Query must be at least 2 characters");
      return;
    }

    const results = (
      await Torrent.fuzzySearch(query)
        .select({ name: 1, infoHash: 1 })
        .limit(5)
        .exec()
    ).filter((r) => r.confidenceScore > 5);

    res.json({ results });
  } catch (e) {
    next(e);
  }
};

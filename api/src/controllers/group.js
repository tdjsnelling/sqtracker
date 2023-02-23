import Group from "../schema/group";
import Torrent from "../schema/torrent";

export const createGroup = async (torrents) => {
  const group = new Group({
    name: torrents[0].name,
    torrents: torrents.map((t) => t._id),
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

export const removeFromGroup = async (req, res, next) => {
  if (req.body.infoHash) {
    try {
      const { groupId } = req.params;

      const group = await Group.findOne({ _id: groupId }).lean();

      if (!group) {
        res.status(404).send("Group does not exist");
        return;
      }

      const torrent = await Torrent.findOne({
        infoHash: req.body.infoHash,
      }).lean();

      if (!group.torrents.includes(torrent._id)) {
        res.status(400).send("Torrent is not a member of group");
        return;
      }

      await Group.findOneAndUpdate(
        { _id: groupId },
        { $pull: { torrents: torrent._id } }
      );

      res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  } else {
    res.status(400).send("Request must include infoHash");
  }
};

import Progress from "../schema/progress";

export const getUserHitNRuns = async (_id) => {
  const progressRecords =
    (await Progress.find({ userId: _id, left: 0 }).lean()) ?? [];
  return progressRecords.filter((p) => p.uploaded.total < p.downloaded.total)
    .length;
};

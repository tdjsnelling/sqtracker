import Progress from '../schema/progress'

export const getUserRatio = async (_id) => {
  let totalUp = 0
  let totalDown = 0

  const userTorrents = await Progress.find({ userId: _id }).lean()

  for (const userTorrent of userTorrents) {
    totalUp += Number(userTorrent.uploaded)
    totalDown += Number(userTorrent.downloaded)
  }

  return totalDown === 0 ? -1 : Number((totalUp / totalDown).toFixed(2))
}

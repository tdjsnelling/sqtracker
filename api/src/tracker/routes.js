import parseHttpRequest from 'bittorrent-tracker/lib/server/parse-http'
import bencode from 'bencode'
import handleAnnounce from './announce'

const createTrackerRoute = (action, onRequest) => async (req, res) => {
  if (action === 'announce') {
    await handleAnnounce(req, res)
    if (res.writableEnded) return
  }

  let params
  try {
    params = parseHttpRequest(req, { action })
    params.httpReq = req
    params.httpRes = res
  } catch (err) {
    res.end(
      bencode.encode({
        'failure reason': err.message,
      })
    )
  }
  onRequest(params, (err, response) => {
    let finalResponse = response
    if (err) {
      finalResponse = {
        'failure reason': err.message,
      }
    } else {
      if (action === 'announce') {
        finalResponse['interval'] = 30
        finalResponse['min interval'] = 30
      }
    }
    res.end(bencode.encode(finalResponse))
  })
}

export default createTrackerRoute

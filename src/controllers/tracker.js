import querystring from 'querystring'

const binaryToHex = (b) => Buffer.from(b, 'binary').toString('hex')

const parseParams = (query) =>
  querystring.parse(query, null, null, {
    decodeURIComponent: unescape,
  })

export const handleRequest = (req) => {
  const q = req.url.split('?')[1]
  const params = parseParams(q)

  console.log(`userId: ${req.userId}`)
  console.log(`query: ${JSON.stringify(params, null, 2)}`)

  const infoHash = binaryToHex(params.info_hash)
  console.log(infoHash)
}

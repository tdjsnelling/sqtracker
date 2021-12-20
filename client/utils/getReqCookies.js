export default (req) => {
  const {
    headers: { cookie },
  } = req
  console.log(cookie.split(';').map((c) => c.split('=')))
  return cookie
    .split(';')
    .map((c) => c.split('='))
    .reduce((acc, [k, v]) => {
      acc[decodeURIComponent(k.trim())] = decodeURIComponent(v.trim())
      return acc
    }, {})
}

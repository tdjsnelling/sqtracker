require('dotenv').config({ path: '../.env' })

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    SQ_SITE_NAME: process.env.SQ_SITE_NAME,
  },
}

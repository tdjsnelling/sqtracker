const config = require('../config')

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  publicRuntimeConfig: {
    ...config.envs,
  },
  serverRuntimeConfig: {
    ...config.envs,
    ...config.secrets,
  },
}

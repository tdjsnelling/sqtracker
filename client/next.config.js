const config = require('../config')

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    styledComponents: true,
  },
  publicRuntimeConfig: {
    ...config.envs,
  },
  serverRuntimeConfig: {
    ...config.envs,
    ...config.secrets,
  },
}

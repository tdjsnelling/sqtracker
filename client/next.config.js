const { withSentryConfig } = require("@sentry/nextjs");
const config = require("../config");
const { version } = require("./package.json");

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    styledComponents: true,
  },
  publicRuntimeConfig: {
    ...config.envs,
    SQ_VERSION: version,
  },
  serverRuntimeConfig: {
    ...config.envs,
    ...config.secrets,
  },
  sentry: {
    hideSourceMaps: true,
  },
};

const sentryWebpackPluginOptions = {
  silent: true,
  errorHandler: (err, invokeErr, compilation) => {
    compilation.warnings.push("Sentry CLI Plugin: " + err.message);
  },
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);

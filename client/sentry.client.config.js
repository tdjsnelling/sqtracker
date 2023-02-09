import * as Sentry from '@sentry/nextjs'
import config from '../config'

Sentry.init({
  dsn: 'https://22bc43683da04040aa90e7683ffe022a@o140996.ingest.sentry.io/4504646040616960',
  tracesSampleRate: 1.0,
  environment:
    process.env.NODE_ENV === 'production' ? 'production' : 'development',
})

Sentry.setContext('deployment', {
  name: config.envs.SQ_SITE_NAME,
  url: config.envs.SQ_BASE_URL,
  adminEmail: config.secrets.SQ_ADMIN_EMAIL,
})

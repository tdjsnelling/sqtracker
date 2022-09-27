import * as yup from 'yup'
import config from '../../../config'

const httpRegex = /http(s)?:\/\/.*/
const mongoRegex = /mongodb:\/\/.*/

const configSchema = yup
  .object({
    envs: yup
      .object({
        SQ_SITE_NAME: yup.string().min(1).max(20).required(),
        SQ_SITE_DESCRIPTION: yup.string().min(1).max(80).required(),
        SQ_ALLOW_REGISTER: yup
          .string()
          .oneOf(['open', 'invite', 'closed'])
          .required(),
        SQ_ALLOW_ANONYMOUS_UPLOADS: yup.boolean().required(),
        SQ_MINIMUM_RATIO: yup.number().min(0).required(),
        SQ_BP_PER_GB: yup.number().min(0).required(),
        SQ_TORRENT_CATEGORIES: yup
          .array()
          .of(yup.string())
          .min(1)
          .test('items-unique', 'Categories must be unique', (value) =>
            value.every(
              (category) => value.filter((c) => c === category).length === 1
            )
          )
          .required(),
        SQ_BASE_URL: yup.string().matches(httpRegex).required(),
        SQ_API_URL: yup.string().matches(httpRegex).required(),
        SQ_TRACKER_URL: yup.string().matches(httpRegex).required(),
        SQ_MONGO_URL: yup.string().matches(mongoRegex).required(),
        SQ_MAIL_FROM_ADDRESS: yup.string().email().required(),
        SQ_SMTP_HOST: yup.string().required(),
        SQ_SMTP_PORT: yup.number().integer().min(1).max(65535).required(),
        SQ_SMTP_SECURE: yup.boolean().required(),
      })
      .strict()
      .noUnknown()
      .required(),
    secrets: yup
      .object({
        SQ_JWT_SECRET: yup.string().required(),
        SQ_ADMIN_EMAIL: yup.string().email().required(),
        SQ_SMTP_USER: yup.string().required(),
        SQ_SMTP_PASS: yup.string().required(),
      })
      .strict()
      .noUnknown()
      .required(),
  })
  .strict()
  .noUnknown()
  .required()

const validateConfig = async () => {
  try {
    await configSchema.validate(config)
    console.log('[sq] configuration is valid')
  } catch (e) {
    console.error('[sq] ERROR: invalid configuration:', e.message)
    process.exit(1)
  }
}

export default validateConfig

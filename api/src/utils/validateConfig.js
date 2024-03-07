import * as yup from "yup";

const httpRegex = /http(s)?:\/\/.*/;
const mongoRegex = /mongodb:\/\/.*/;
const hexRegex = /#([a-f0-9]){6}/i;

const configSchema = yup
  .object({
    envs: yup
      .object({
        SQ_SITE_NAME: yup.string().min(1).max(20).required(),
        SQ_SITE_DESCRIPTION: yup.string().min(1).max(80).required(),
        SQ_ALLOW_REGISTER: yup
          .string()
          .oneOf(["open", "invite", "closed"])
          .required(),
        SQ_ALLOW_ANONYMOUS_UPLOADS: yup.boolean().required(),
        SQ_MINIMUM_RATIO: yup.number().min(-1).required(),
        SQ_MAXIMUM_HIT_N_RUNS: yup.number().integer().min(-1).required(),
        SQ_BP_EARNED_PER_GB: yup.number().min(0).required(),
        SQ_BP_EARNED_PER_FILLED_REQUEST: yup.number().min(0).required(),
        SQ_BP_COST_PER_INVITE: yup.number().min(0).required(),
        SQ_BP_COST_PER_GB: yup.number().min(0).required(),
        SQ_SITE_WIDE_FREELEECH: yup.boolean().required(),
        SQ_TORRENT_CATEGORIES: yup.lazy((value) => {
          const entries = Object.keys(value).reduce((obj, key) => {
            obj[key] = yup
              .array()
              .of(yup.string())
              .min(0)
              .test(
                `${key}-items-unique`,
                `Sources in category "${key}" must be unique`,
                (value) =>
                  value.every(
                    (source) => value.filter((c) => c === source).length === 1
                  )
              );
            return obj;
          }, {});
          return yup.object(entries).required();
        }),
        SQ_ALLOW_UNREGISTERED_VIEW: yup.boolean().required(),
        SQ_CUSTOM_THEME: yup.object({
          primary: yup.string().matches(hexRegex),
          background: yup.string().matches(hexRegex),
          sidebar: yup.string().matches(hexRegex),
          border: yup.string().matches(hexRegex),
          text: yup.string().matches(hexRegex),
          grey: yup.string().matches(hexRegex),
        }),
        SQ_EXTENSION_BLACKLIST: yup.array().of(yup.string()).min(0),
        SQ_SITE_DEFAULT_LOCALE: yup
          .string()
          .oneOf(["en", "es", "it", "ru", "de", "zh", "eo", "fr"]),
        SQ_BASE_URL: yup.string().matches(httpRegex).required(),
        SQ_API_URL: yup.string().matches(httpRegex).required(),
        SQ_MONGO_URL: yup.string().matches(mongoRegex).required(),
        SQ_DISABLE_EMAIL: yup.boolean(),
        SQ_MAIL_FROM_ADDRESS: yup
          .string()
          .email()
          .when("SQ_DISABLE_EMAIL", {
            is: (val) => val !== true,
            then: (schema) => schema.required(),
          }),
        SQ_SMTP_HOST: yup.string().when("SQ_DISABLE_EMAIL", {
          is: (val) => val !== true,
          then: (schema) => schema.required(),
        }),
        SQ_SMTP_PORT: yup
          .number()
          .integer()
          .min(1)
          .max(65535)
          .when("SQ_DISABLE_EMAIL", {
            is: (val) => val !== true,
            then: (schema) => schema.required(),
          }),
        SQ_SMTP_SECURE: yup.boolean().when("SQ_DISABLE_EMAIL", {
          is: (val) => val !== true,
          then: (schema) => schema.required(),
        }),
      })
      .strict()
      .noUnknown()
      .required(),
    secrets: yup
      .object({
        SQ_JWT_SECRET: yup.string().required(),
        SQ_SERVER_SECRET: yup.string().required(),
        SQ_ADMIN_EMAIL: yup.string().email().required(),
        SQ_SMTP_USER: yup.string(),
        SQ_SMTP_PASS: yup.string(),
      })
      .when("envs.SQ_DISABLE_EMAIL", {
        is: (val) => val !== true,
        then: (schema) => {
          schema.fields.SQ_SMTP_USER = yup.string().required();
          schema.fields.SQ_SMTP_PASS = yup.string().required();
          return schema;
        },
      })
      .strict()
      .noUnknown()
      .required(),
  })
  .strict()
  .noUnknown()
  .required();

const validateConfig = async (config) => {
  try {
    process.env = {
      ...process.env,
      ...config.envs,
      ...config.secrets,
    };
    await configSchema.validate(config);
    console.log("[sq] configuration is valid");
  } catch (e) {
    console.error("[sq] ERROR: invalid configuration:", e.message);
    process.exit(1);
  }
};

export default validateConfig;

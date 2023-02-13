/*
  This is an example configuration file. Copy it to config.js and change each value according to your desired setup.
  See the README.md file for a description of each configuration item.
*/

module.exports = {
  envs: {
    SQ_SITE_NAME: 'sqtracker demo',
    SQ_SITE_DESCRIPTION: 'A short description for your tracker site',
    SQ_THEME_COLOUR: '#f45d48',
    SQ_ALLOW_REGISTER: 'invite',
    SQ_ALLOW_ANONYMOUS_UPLOADS: false,
    SQ_MINIMUM_RATIO: 0.75,
    SQ_TORRENT_CATEGORIES: ['Movies', 'TV', 'Music', 'Books'],
    SQ_BP_EARNED_PER_GB: 1,
    SQ_BP_COST_PER_INVITE: 3,
    SQ_BP_COST_PER_GB: 3,
    SQ_SITE_WIDE_FREELEECH: false,
    SQ_BASE_URL: 'https://sqtracker.dev',
    SQ_API_URL: 'https://sqtracker.dev/api',
    SQ_TRACKER_URL: 'http://sq_opentracker:6969',
    SQ_MONGO_URL: 'mongodb://sq_mongodb',
    SQ_MAIL_FROM_ADDRESS: 'mail@sqtracker.dev',
    SQ_SMTP_HOST: 'smtp.example.com',
    SQ_SMTP_PORT: 587,
    SQ_SMTP_SECURE: false,
  },
  secrets: {
    SQ_JWT_SECRET: 'long_random_string',
    SQ_ADMIN_EMAIL: 'admin@example.com',
    SQ_SMTP_USER: 'smtp_username',
    SQ_SMTP_PASS: 'smtp_password',
  },
}

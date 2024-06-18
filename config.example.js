// This is an example configuration file.
// Copy it to config.js and change each value according to your desired setup.

module.exports = {
  envs: {
    // The name of your tracker site. Maximum 20 characters.
    SQ_SITE_NAME: "sqtracker demo",

    // A short description of your tracker site. Maximum 80 characters.
    SQ_SITE_DESCRIPTION: "A short description for your tracker site",

    // A map of custom hex colours to use as the theme of your site.
    // If not specified, the default light and dark themes will be used.
    // If only "primary" is specified, the default light and dark themes will be used but with your main brand colour.
    // If the other values are specified, the fully custom theme will be used and not the default light/dark.
    SQ_CUSTOM_THEME: {
      primary: "#f45d48",
      // background: "#1f2023", // Page background colour
      // sidebar: "#27282b",    // A secondary background colour, used for sidebar, infoboxes etc.
      // border: "#303236",     // Border colour
      // text: "#f8f8f8",       // Text colour. Should be readable against background and sidebar
      // grey: "#aaa",          // Secondary text colour, used for less important text
    },

    // Registration mode. Either "open", "invite" or "closed".
    // Open: anyone can register.
    // Invite: must be invited by existing user.
    // Closed: no one can register.
    SQ_ALLOW_REGISTER: "invite",

    // A boolean value determining whether users can choose to upload anonymously.
    // Admins can still see who uploaded anonymously, but other users cannot.
    SQ_ALLOW_ANONYMOUS_UPLOADS: false,

    // Minimum allowed ratio. Below this users will not be able to download. Set to -1 to disable.
    SQ_MINIMUM_RATIO: 0.75,

    // Maximum allowed hit'n'runs. Above this users will not be allowed to download. Set to -1 to disable.
    // A user has committed a hit'n'run when a torrent is fully downloaded and not seeded to a 1:1 ratio.
    SQ_MAXIMUM_HIT_N_RUNS: 1,

    // A map of torrent categories that can be selected when uploading.
    // Each has an array of zero or more sources available within that category.
    SQ_TORRENT_CATEGORIES: {
      Movies: ["BluRay", "WebDL", "HDRip", "WebRip", "DVD", "Cam"],
      TV: [],
      Music: [],
      Books: [],
    },

    // Number of bonus points awarded to a user for each GB they upload. Minimum 0.
    SQ_BP_EARNED_PER_GB: 1,

    // Number of bonus points awarded to a user if they suggest a torrent to fill a request and it gets accepted
    // They get double if they also the uploader of the accepted torrent
    SQ_BP_EARNED_PER_FILLED_REQUEST: 1,

    // Number of bonus points it costs a user to buy 1 invite (set to 0 to disable buying invites).
    SQ_BP_COST_PER_INVITE: 3,

    // Number of bonus points it costs a user to buy 1 GB of upload (set to 0 to disable buying upload).
    SQ_BP_COST_PER_GB: 3,

    // Whether to enable freeleech on all torrents.
    SQ_SITE_WIDE_FREELEECH: false,

    // Whether torrent pages can be viewed by unregistered users.
    // If true, only logged-in users will be able to download/interact, but anyone (search engines included) will be able to view/read torrent info.
    // Non-logged-in users will also be able to browse category/tag pages and wiki pages that have been set to public.
    // Enable if you want torrents to be indexed to help search traffic.
    SQ_ALLOW_UNREGISTERED_VIEW: false,

    // An array of blacklisted file extensions. Torrents containing files with these extensions will fail to upload.
    SQ_EXTENSION_BLACKLIST: ["exe"],

    // Default site locale. See `client/locales/index.js` for available options.
    SQ_SITE_DEFAULT_LOCALE: "en",

    // The URL of your tracker site.
    // For local development, this should be `http://127.0.0.1:3000`.
    SQ_BASE_URL: "https://sqtracker.dev",

    // The URL of your API. Under the recommended setup, it should be `${SQ_BASE_URL}/api`.
    // For local development, this should be `http://127.0.0.1:3001`.
    SQ_API_URL: "https://sqtracker.dev/api",

    // The URL of your MongoDB server. Under the recommended setup, it should be `mongodb://sq_mongodb/sqtracker`.
    // For local development, this should be `mongodb://127.0.0.1/sqtracker`.
    SQ_MONGO_URL: "mongodb://sq_mongodb/sqtracker",

    // Disables sending of any emails and removes the need for an SMTP server.
    // Fine for testing, not recommended in production as users will not be able to reset their passwords.
    SQ_DISABLE_EMAIL: false,

    // The email address that mail will be sent from.
    // Not required if SQ_DISABLE_EMAIL=true.
    SQ_MAIL_FROM_ADDRESS: "mail@sqtracker.dev",

    // The hostname of your SMTP server.
    // Not required if SQ_DISABLE_EMAIL=true.
    SQ_SMTP_HOST: "smtp.example.com",

    // The port of your SMTP server.
    // Not required if SQ_DISABLE_EMAIL=true.
    SQ_SMTP_PORT: 587,

    // Whether to force SMTP TLS: if true the connection will use TLS when connecting to server.
    // If false (the default) then TLS is used if server supports the STARTTLS extension.
    // In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false.
    // Not required if SQ_DISABLE_EMAIL=true.
    SQ_SMTP_SECURE: false,
  },
  secrets: {
    // A secret value to sign tokens with. Should be long and random.
    SQ_JWT_SECRET: "long_random_string",

    // A secret value to verify server requests with. Should be long and random, and different to the JWT secret.
    SQ_SERVER_SECRET: "another_long_random_string",

    // The email address to use for the initial admin user.
    // Must be valid, you will need to verify.
    SQ_ADMIN_EMAIL: "admin@example.com",

    // The username to authenticate with your SMTP server with.
    // Not required if SQ_DISABLE_EMAIL=true.
    SQ_SMTP_USER: "smtp_username",

    // The password to authenticate with your SMTP server with.
    // Not required if SQ_DISABLE_EMAIL=true.
    SQ_SMTP_PASS: "smtp_password",
  },
};

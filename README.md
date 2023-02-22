# ■ sqtracker

sqtracker is a private BitTorrent tracker platform.

It implements all of the features required to run a private (or public) tracker and does not focus on any one specific type of content. It is suitable for running a tracker site of any kind.

## Features

* Accounts
  * Registration modes (open/closed/invite only)
  * Sending of invites
  * Account management (2FA, password resets etc.)
  * Bonus points system
* Torrent management
  * Uploading torrents with rich metadata (titles, descriptions, categories, tags etc.)
  * Searching torrents or browsing by category or tags
  * Freeleech options (specific torrents, sitewide)
* Upload/download tracking
  * Track how much content each user has uploaded/downloaded
  * Track ratios
  * Limit up/downloading per user based on ratio
  * Award invites based on ratio
* User interaction
  * Commenting on torrents
  * Up/down voting torrents
  * Requests system
* Moderation
  * Staff/admin privileges
  * Reporting torrents to be reviewed by staff
  * Detailed stats available to admins
  * Announcements/news posts (for posting of tracker rules, important updates etc.)
  * Ban/unban users

## Deploying

### Components

An sqtracker deployment is made up of 4 separate components. These are:

#### A MongoDB database

[MongoDB](https://www.mongodb.com/) is a popular and powerful document-oriented database. Version 5.2 or higher is required.

#### The sqtracker API service

The sqtracker API service handles all actions taken by users (authentication, uploads, searching etc.), implements the BitTorrent tracker specification to handle announces and scrapes, and provides the RSS feed. 

#### The sqtracker client service

The sqtracker client service provides the modern, responsive web interface that users interact with.

#### A HTTP proxy server

The HTTP proxy allows the client, API, and BitTorrent tracker to all be accessible via a single endpoint.

### Deploying with Docker compose

The sqtracker platform is designed to be deployed via Docker. Once a configuration file is created, deploying is as simple as running `docker compose up -d` at the root of the project.

Alternatively, you can deploy each service individually on a PaaS cloud platform such as [Northflank](https://northflank.com).

If you change the name of any services in `docker-compose.yml`, you will also need to update the relevant host names in your `config.js` and `traefik.yml` files.

## Configuration

All configuration is provided via a single JavaScript file named `config.js`. This file must export an object containing 2 keys: `envs` and `secrets`.

A full list of configuration options is below. All are required.

If your configuration is not valid, sqtracker will fail to start.

| Key                        | Type    | Example                                  | Description                                                                                                                                                                                                                                                                                  |
|----------------------------|---------|------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| SQ_SITE_NAME               | envs    | sqtracker demo                           | The name of your tracker site                                                                                                                                                                                                                                                                |
| SQ_SITE_DESCRIPTION        | envs    | My very own private tracker              | A short description of your tracker site                                                                                                                                                                                                                                                     |
| SQ_THEME_COLOUR            | envs    | #f45d48                                  | A hex colour code used as the main theme colour of your site                                                                                                                                                                                                                                 |
| SQ_ALLOW_REGISTER          | envs    | `invite`                                 | Registration mode. Either `open`, `invite` or `closed`                                                                                                                                                                                                                                       |
| SQ_ALLOW_ANONYMOUS_UPLOADS | envs    | `false`                                  | Whether or not users can upload torrents anonymously. Either `true` or `false`                                                                                                                                                                                                               |
| SQ_MINIMUM_RATIO           | envs    | 0.75                                     | Minimum allowed ratio. Below this users will not be able to download                                                                                                                                                                                                                         |
| SQ_BP_EARNED_PER_GB        | envs    | 1                                        | Number of bonus points awarded to a user for each GB they upload                                                                                                                                                                                                                             |
| SQ_BP_COST_PER_INVITE      | envs    | 3                                        | Number of bonus it costs a user to buy 1 invite (set to 0 to disable buying invites)                                                                                                                                                                                                         |
| SQ_BP_COST_PER_GB          | envs    | 3                                        | Number of bonus it costs a user to buy 1 GB of upload (set to 0 to disable buying upload)                                                                                                                                                                                                    |
| SQ_SITE_WIDE_FREELEECH     | envs    | `true`                                   | Whether or not to enable freeleech on all torrents                                                                                                                                                                                                                                           |
| SQ_TORRENT_CATEGORIES      | envs    | `{ "Movies": ["HD", ...], "TV": [...] }` | A dictionary of categories, each with an array of zero or more sources available within that category                                                                                                                                                                                        |
| SQ_BASE_URL                | envs    | https://demo.sqtracker.dev               | The URL of your tracker site                                                                                                                                                                                                                                                                 |
| SQ_API_URL                 | envs    | https://demo.sqtracker.dev/api           | The URL of your API. Under the recommended setup, it should be `${SQ_BASE_URL}/api`                                                                                                                                                                                                          |
| SQ_MONGO_URL               | envs    | mongodb://sq_mongodb/sq                  | The URL of your MongoDB server. Under the recommended setup, it should be `mongodb://sq_mongodb/sq`                                                                                                                                                                                          |
| SQ_MAIL_FROM_ADDRESS       | envs    | mail@sqtracker.dev                       | The address that mail will be sent from                                                                                                                                                                                                                                                      |
| SQ_SMTP_HOST               | envs    | smtp.example.com                         | The hostname of your SMTP server                                                                                                                                                                                                                                                             |
| SQ_SMTP_PORT               | envs    | 587                                      | The port of your SMTP server                                                                                                                                                                                                                                                                 |
| SQ_SMTP_SECURE             | envs    | `false`                                  | Whether or not to force SMTP TLS: if true the connection will use TLS when connecting to server. If false (the default) then TLS is used if server supports the STARTTLS extension. In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false |
| SQ_JWT_SECRET              | secrets | —                                        | A secret value to sign tokens with. Should be long and random                                                                                                                                                                                                                                |
| SQ_SERVER_SECRET           | secrets | —                                        | A secret value to verify server requests with. Should be long and random, and different to the JWT secret                                                                                                                                                                                    |
| SQ_ADMIN_EMAIL             | secrets | admin@example.com                        | The email address to use for the initial admin user. Must be valid                                                                                                                                                                                                                           |
| SQ_SMTP_USER               | secrets | —                                        | The username to authenticate with your SMTP server with                                                                                                                                                                                                                                      |
| SQ_SMTP_PASS               | secrets | —                                        | The password to authenticate with your SMTP server with                                                                                                                                                                                                                                      |

### Example configuration

An example configuration can be found in `config.example.js`.

## Screenshots

Splash screen
<img width="1663" alt="splash" src="https://user-images.githubusercontent.com/6264509/218762121-e7800d27-c5f1-4288-ba6e-f33c235b9b27.png">

Home
<img width="1707" alt="home" src="https://user-images.githubusercontent.com/6264509/218762088-e604d1d6-7f6a-4910-b7ff-500e0e762056.png">

Torrent
<img width="1707" alt="torrent" src="https://user-images.githubusercontent.com/6264509/218762124-70d00f99-287a-4efa-90ed-47db7a0be39b.png">

Upload
<img width="1707" alt="upload" src="https://user-images.githubusercontent.com/6264509/218762133-0a359ca0-6a18-4440-80f6-6d28adba1a6f.png">

Categories
<img width="1707" alt="categories" src="https://user-images.githubusercontent.com/6264509/218762073-b1d42889-2868-414e-af60-9fe75ba48ee1.png">

Profile
<img width="1663" alt="profile" src="https://user-images.githubusercontent.com/6264509/218762104-238c90ab-c144-42f1-869e-bbae120f556f.png">

Account
<img width="1663" alt="account" src="https://user-images.githubusercontent.com/6264509/218762053-90667723-db6e-473c-8ae0-11bc635f322e.png">

Announcement
<img width="1663" alt="announcement" src="https://user-images.githubusercontent.com/6264509/218762065-e91ca084-1f9a-4af5-9232-291d87625c7a.png">

Request
<img width="1663" alt="request" src="https://user-images.githubusercontent.com/6264509/218762116-38cf1b95-7c76-4476-9276-19f6c77c2c9a.png">

Report
<img width="1707" alt="report" src="https://user-images.githubusercontent.com/6264509/218762109-b76bd5f1-b333-4d09-9c9a-e2fa87b3c2de.png">

## Contrubting

Pull requests are welcome! If you fork sqtracker and think you have made some improvements, please open a pull request so other users deploying sqtracker from this repository can also get the benefits.

Please see the [./CONTRIBUTING.md](CONTRIBUTING) document for guidance on code style etc.

## License

GNU GPLv3

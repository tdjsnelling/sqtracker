# ■ sqtracker

sqtracker is a private BitTorrent tracker platform.

It implements all of the features required to run a private (or public) tracker and does not focus on any one specific type of content. It is suitable for running a tracker site of any kind.

## Features

* Accounts
  * Registration modes (open/closed/invite only)
  * Sending of invites
  * Account management (2FA, password resets etc.)
* Torrent management
  * Uploading torrents with rich metadata (titles, descriptions, categories, tags etc.)
  * Searching torrents or browsing by category
  * Freeleech options (specific torrents, sitewide)
* Upload/download tracking
  * Track how much content each user has uploaded/downloaded
  * Track ratios
  * Limit up/downloading per user based on ratio
  * Award invites based on ratio
* User interaction
  * Commenting on torrents
  * Up/down voting torrents
* Moderation
  * Staff/admin privileges
  * Reporting torrents to be reviewed by staff
  * Detailed stats available to admins
  * Announcements/news posts (for posting of tracker rules, important updates etc.)

## Deploying

### Components

An sqtracker deployment is made up of 5 separate components. These are:

#### A BitTorrent tracker

sqtracker does not implement the BitTorrent tracker spec itself. Instead, it works alongside a tracker server such as [opentracker](https://erdgeist.org/arts/software/opentracker/). In theory, other generic BitTorrent tracker software should work, but opentracker is recommended for the time being.

#### A MongoDB database

[MongoDB](https://www.mongodb.com/) is a popular and powerful document-oriented database.

#### The sqtracker API service

The sqtracker API service handles all actions taken by users (authentication, uploads, searching etc.), provides the RSS feed, and proxies announce requests to the tracker server. 

#### The sqtracker client service

The sqtracker client service provides the modern, responsive web interface that users interact with.

#### A HTTP proxy server

The HTTP proxy allows the client, API, and BitTorrent tracker to all be accessible via a single endpoint.

### Deploying with Docker compose

The sqtracker platform is designed to be deployed via Docker. Once a configuration file is created, deploying is as simple as running `docker compose up -d` at the root of the project.

Alternatively, you can deploy each service individually on a PaaS cloud platform such as [Northflank](https://northflank.com).

## Configuration

All configuration is provided via a single JavaScript file. This file must export an object containing 2 keys: `envs` and `secrets`.

A full list of configuration options is below. All are required.

| Key                        | Type    | Example                        | Description                                                                                                                                                                                                                                                                                  |
|----------------------------|---------|--------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| SQ_SITE_NAME               | envs    | sqtracker demo                 | The name of your tracker site                                                                                                                                                                                                                                                                |
| SQ_SITE_DESCRIPTION        | envs    | My very own private tracker    | A short description of your tracker site                                                                                                                                                                                                                                                     |
| SQ_ALLOW_REGISTER          | envs    | `invite`                       | Registration mode. Either `open`, `invite` or `closed`                                                                                                                                                                                                                                       |
| SQ_ALLOW_ANONYMOUS_UPLOADS | envs    | `false`                        | Whether or not users can upload torrents anonymously. Either `true` or `false`                                                                                                                                                                                                               |
| SQ_MINIMUM_RATIO           | envs    | 0.75                           | Minimum allowed ratio. Below this users will not be able to download                                                                                                                                                                                                                         |
| SQ_TORRENT_CATEGORIES      | envs    | `["Movies", "TV"]`             | An array of categories available on your tracker site                                                                                                                                                                                                                                        |
| SQ_BASE_URL                | envs    | https://demo.sqtracker.dev     | The URL of your tracker site                                                                                                                                                                                                                                                                 |
| SQ_API_URL                 | envs    | https://demo.sqtracker.dev/api | The URL of your API. Under the recommended setup, it should be `${SQ_BASE_URL}/api`                                                                                                                                                                                                          |
| SQ_TRACKER_URL             | envs    | http://sq_opentracker:6969     | The URL of your tracker server. Under the recommended setup, it should be `http://sq_opentracker:6969`                                                                                                                                                                                       |
| SQ_MONGO_URL               | envs    | mongodb://sq_mongodb/sq        | The URL of your MongoDB server. Under the recommended setup, it should be `mongodb://sq_mongodb/sq`                                                                                                                                                                                          |
| SQ_MAIL_FROM_ADDRESS       | envs    | mail@sqtracker.dev             | The address that mail will be sent from                                                                                                                                                                                                                                                      |
| SQ_SMTP_HOST               | envs    | smtp.example.com               | The hostname of your SMTP server                                                                                                                                                                                                                                                             |
| SQ_SMTP_PORT               | envs    | 587                            | The port of your SMTP server                                                                                                                                                                                                                                                                 |
| SQ_SMTP_SECURE             | envs    | `false`                        | Whether or not to force SMTP TLS: if true the connection will use TLS when connecting to server. If false (the default) then TLS is used if server supports the STARTTLS extension. In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false |
| SQ_JWT_SECRET              | secrets | —                              | A secret value to sign tokens with. Should be long and random                                                                                                                                                                                                                                |
| SQ_ADMIN_EMAIL             | secrets | admin@example.com              | The email address to use for the initial admin user. Must be valid                                                                                                                                                                                                                           |
| SQ_SMTP_USER               | secrets | —                              | The username to authenticate with your SMTP server with                                                                                                                                                                                                                                      |
| SQ_SMTP_PASS               | secrets | —                              | The password to authenticate with your SMTP server with                                                                                                                                                                                                                                      |

### Example configuration

An example configuration can be found in `config.example.js`.

## License

GNU GPLv3

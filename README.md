# ■ sqtracker

sqtracker is a modern private BitTorrent tracker platform.

It implements all of the features required to run a private (or public) tracker and does not focus on any one specific type of content. It is suitable for running a tracker site of any kind.

Please join the [Discord server](https://discord.gg/BEGXEk29Up) for support and general chat.

## Features

* Accounts
  * Registration modes (open / closed / invite only)
  * Sending of invites
  * Account management (2FA, password resets etc.)
  * Bonus points system (purchase invites, upload etc.)
  * Option to browse torrents without logging in (for search engine discovery)
* Torrent management
  * Uploading torrents with rich metadata (title, description, source, mediainfo, category, tags etc.)
  * Searching torrents or browsing by category or tags
  * Freeleech options (specific torrents, site-wide)
  * Torrent grouping (e.g. different formats of same movie)
  * Bookmarks
* Upload / download tracking
  * Track how much content each user has uploaded / downloaded
  * Track ratios
  * Limit up / downloading per user based on ratio
  * Award bonus points based on upload
* User interaction
  * Commenting on torrents and announcements
  * Up / down voting torrents
  * Requests system
* Moderation
  * Staff / admin privileges
  * Reporting torrents to be reviewed by staff
  * Detailed stats available to admins
  * Wiki system
  * Announcements / news posts
  * Ban / unban users
* Tracker appearance
  * Configurable theme / CSS

## Deploying

### Components

An sqtracker deployment is made up of 4 separate components. These are:

#### 1. The sqtracker API service

The sqtracker API service handles all actions taken by users (authentication, uploads, searching etc.), implements the BitTorrent tracker specification to handle announces and scrapes, and provides the RSS feed. 

#### 2. The sqtracker client service

The sqtracker client service provides the modern, responsive web interface that users interact with.

#### 3. A MongoDB database

[MongoDB](https://www.mongodb.com/) is a popular and powerful document-oriented database. Version 5.2 or higher is required.

#### 4. A HTTP proxy server

The HTTP proxy allows the client, API, and BitTorrent tracker to all be accessible via a single endpoint.

### Deploying with Docker compose

The sqtracker platform is designed to be deployed via Docker. Once a configuration file is created, deploying is as simple as running `docker compose up -d` at the root of the project.

If you change the name of any services in `docker-compose.yml`, you will also need to update the relevant host names in your `config.js` and `traefik.yml` files.

sqtracker is reasonably light-weight, but you should still invest in a VPS with decent resources if you want to run a fast and performant tracker.

### Deploying with a PaaS platform

Alternatively, you can deploy each service individually on a PaaS cloud platform such as [Northflank](https://northflank.com).

You will need to deploy each of the 4 components listed above. The Docker images for the client and API services are published in this repository.

## Configuration

All configuration is provided via a single JavaScript file named `config.js`. This file must export an object containing 2 keys: `envs` and `secrets`.

An example configuration can be found in `config.example.js`. This file contains examples and explanations for each config value.

If your configuration is not valid, sqtracker will fail to start.

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

## Contributing

Pull requests are welcome! If you fork sqtracker and think you have made some improvements, please open a pull request so other users deploying sqtracker from this repository can also get the benefits.

Please see the [CONTRIBUTING](./CONTRIBUTING.md) document for guidance on code style etc.

## License

GNU GPLv3

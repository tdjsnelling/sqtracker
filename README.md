# ■ sqtracker

*sqtracker* is a private BitTorrent tracker service that implements things like user accounts, ratio tracking, commenting, voting, moderation, and more.

This is particularly useful for private tracker communities that want to control who can download, how much they must seed and so on.

*sqtracker* works in conjunction with [opentracker](https://erdgeist.org/arts/software/opentracker/), which provides the actual BitTorrent tracker protocol. *sqtracker* can be thought of a sort of front-end built on top of opentracker, providing everything else you need to run a full private tracker platform.

As the BitTorrent tracker protocol has a [proper specification](https://www.bittorrent.org/beps/bep_0003.html), other tracker software that implements the protocol properly should also be compatible with *sqtracker*. However, only opentracker is tested, and opentracker is used in the `docker-compose.yml` file.

## Features

* Accounts
  * registration (open/closed/invite only),
  * log in,
  * password resets etc.
* Torrent management
  * uploading torrents,
  * user submitted metadata (titles, descriptions etc.),
  * downloading torrent files with user-specific announce URLs,
  * track active seeders & leechers of a torrent,
  * freeleech options
* Upload/download tracking
  * track how much content each user has uploaded/downloaded,
  * track ratios,
  * limit up/downloading per user based on ratio
* User interaction
  * commenting on torrents,
  * up/down voting torrents
* Moderation
  * staff/admin privileges,
  * reporting torrents,
  * detailed stats available to admins,
  * announcements/news posts

## Deploying

### Configuration

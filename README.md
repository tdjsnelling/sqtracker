# ■ sqtracker

*sqtracker* (or squaretracker, tracker²) is a front-end for BitTorrent trackers such as [opentracker](https://erdgeist.org/arts/software/opentracker/) that adds things like account management and ratio tracking. It's tracking the tracker, hence the name.

This is particularly useful for private tracker communities that want to control who can download, how much they must seed and so on.

As *sqtracker* just sits in front of a BitTorrent tracker, it should theoretically be compatible with any. However opentracker is the most tested and is recommended.

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
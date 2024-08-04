# Discogs Offline Library (name TBD)

A mobile PWA designed to retain your Discogs library offline, so you can check your library while collecting without worrying about mobile reception.

> [!IMPORTANT]  
> This is not production ready, and undergoing pre-alpha changes - **USAGE IS RISKY AT THIS POINT** and PRs will not be accepted at this time.

## Installing

[Please see the Mozilla documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing), which covers installing PWAs on all platforms.

## Usage

This application currently uses your **Personal Access Token**, until **OAuth** is built in. You can grab your token from the [Discogs Developer Settings](https://www.discogs.com/settings/developers).

You can access settings by going to **Profile**, then **Settings** (top-right cog), and putting your username and token in the relevant fields.

For the security-concious: Your details are **only** used for Discogs API communications. You can verify this by [looking at the API file](/src/api/discogs.ts).

<p align="center">
  <img src="/assets/logo-app.png" alt="" />
</p>
<h1 align="center">Localib</h1>
<p align="center">
  <img src="https://f.subo.dev/i/discogs-app-image.webp" alt="" />
</p>

A mobile PWA designed to retain your Discogs library offline, so you can check your library while collecting without worrying about mobile reception.

> [!IMPORTANT]  
> This is not production ready, and undergoing pre-alpha changes - **USAGE IS RISKY AT THIS POINT** and PRs will not be accepted at this time.

## Installing

[Please see the Mozilla documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing), which covers installing PWAs on all platforms.

## Usage

This application currently uses your **Personal Access Token**, until **OAuth** is built in. You can grab your token from the [Discogs Developer Settings](https://www.discogs.com/settings/developers).

You can access settings by going to **Profile**, then **Settings** (top-right cog), and putting your username and token in the relevant fields.

For the security-concious: Your details are **only** used for Discogs API communications. You can verify this by [looking at the API file](/src/api/discogs.ts).

### Scraper

The project also contains a Discogs image scraper, built in .NET. This is designed to queue up IDs, then grab images from the Discogs API in a slow enough manner that it doesn't hit the rate limiter. This uses a MySQL database to manage state.

Configuration is via `appsettings.json` or environment variables:

* `ConnectionStrings__DefaultConnection` - Connection to a MySQL database, like `Server=localhost;Database=discoarchive;User=root;Password=password;`
* `PathSettings__ImagePath` - Path where the Worker stores to, and the API serves images from.
* `Discogs__ConsumerKey` - Key value from [Discogs Developer Application][dcd].
* `Discogs__ConsumerKey` - Key value from [Discogs Developer Application][dcd].

Example:

```bash
docker run --rm \
  --name Localib \
  -e ConnectionStrings__DefaultConnection="Server=localhost;Database=disc;User=root;Password=password;" \
  -e PathSettings__ImagePath=/Images \
  -e Discogs__ConsumerKey=somekeyvalue \
  -e Discogs__ConsumerSecret=somekeyvalue \
  -v "$(pwd)/Images:/Images" \
  -p 8080:8080 \
  ghcr.io/soup-bowl/netscrape:edge
```

### Testing Offline Capabilities

If you want to test the PWA functionality locally, you can add the following to the `VitePWA()` segment in `vite.config.ts`:

```js
devOptions: { enabled: true },
```


## Logo

The temporary logo utilises the **album-collection** icon from [Free icons](https://free-icons.github.io/free-icons/).

[dcd]: https://www.discogs.com/settings/developers

<p align="center">
  <img src="/assets/logo-app.png" alt="" />
</p>
<h1 align="center">Localib</h1>
<p align="center">
  <strong>Modern Discogs experience, with a focus on limited internet library management</strong>
</p>
<p align="center">
  <img src="https://f.subo.dev/i/discogs-app-image.webp" alt="" />
</p>

A mobile PWA and API designed to persist your Discogs library on your device, so you can check your library while collecting without worrying about mobile reception.

> [!IMPORTANT]  
> This application is in alpha - Expect bugs, reports welcome but **PRs will not be accepted** at this time.

## Installing the PWA

[Please see the Mozilla documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing), which covers installing PWAs on all platforms.

## Usage

Once visited or installed, pop into Settings and log into your Discogs account (handled via [Discogs OAuth](https://www.discogs.com/developers/#page:authentication,header:authentication-discogs-auth-flow)). The app should load up your information (this may take a while on large collections), and store all of this information in your devices' **IndexedDB**. The application will persist this **as long as possible** (some devices unfortunately make this a challenge), allowing you to browse your collection without a constant internet connection.

### API

This project has a counterpart API service (internally referenced as the **Vinyl Service**). This service is charged with proxying your requests to the Discogs API in a secure manner, and also - where possible and necessary - scraping and storing image data from Discogs to aid in the off-network persistence.

The API consists of two separate applications - a REST API, and a worker service that collects all the records passing through the system, and downloads the artwork for it. This service will scrape the dominant album art, and store both the thumbnail and a heavily-optimised larger image to allow for optional higher-quality album art persistence.

Configuration is primarily via environment variables, or by `appsettings.json`:

Variable | Description
-|-
`ConnectionStrings__DefaultConnection` | Connection to a MySQL database, like `Server=localhost;Database=discoarchive;User=root;Password=password;`
`PathSettings__ImagePath` | Path where the Worker stores to, and the API serves images from.
`Discogs__ConsumerKey` | Consumer Key from [Discogs Developer Application][dcd], used by both the API and the worker.
`Discogs__ConsumerSecret` | Consumer Secret from [Discogs Developer Application][dcd], used by both the API and the worker.
`Discogs__CallbackURL` | Callback to the frontend's `/callback` URL to handle OAuth flow.

Environment only:

Variable | Description
-|-
`CORS_ALLOWED_ORIGINS` | CORS restriction policy, optional.

Example:

```bash
docker run --rm \
  --name Localib \
  -e ConnectionStrings__DefaultConnection="Server=localhost;Database=disc;User=root;Password=password;" \
  -e PathSettings__ImagePath=/Images \
  -e Discogs__ConsumerKey=somekeyvalue \
  -e Discogs__ConsumerSecret=somekeyvalue \
  -e Discogs__CallbackURL=https://localib.app/callback \
  -v "$(pwd)/Images:/Images" \
  -p 8080:8080 \
  ghcr.io/soup-bowl/netscrape-combined:edge
```

### Testing Offline Capabilities

If you want to test the PWA functionality locally, you can add the following to the `VitePWA()` segment in `vite.config.ts`:

```js
devOptions: { enabled: true },
```


## Logo

The temporary logo utilises the **album-collection** icon from [Free icons](https://free-icons.github.io/free-icons/).

[dcd]: https://www.discogs.com/settings/developers

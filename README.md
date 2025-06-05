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

Configuration is via environment variables:

| Variable                          | Impacts | Description                                                                                       |
| --------------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `LOCALIB_DB_HOST`                 | Both    | PostgreSQL database hostname. Default `localhost`.                                                |
| `LOCALIB_DB_PORT`                 | Both    | PostgreSQL port number. Default `5432`.                                                           |
| `LOCALIB_DB_NAME`                 | Both    | PostgreSQL database schema. Default `postgres`.                                                   |
| `LOCALIB_DB_USER`                 | Both    | PostgreSQL database access user. Default `postgres`.                                              |
| `LOCALIB_DB_PASSWORD`             | Both    | PostgreSQL database access password. Default `password` (lol).                                    |
| `LOCALIB_CONNECTION_STRING`       | Both    | PostgreSQL Connection string. Overrides the above fields, if set.                                 |
| `LOCALIB_IMAGE_PATH`              | Both    | Path where the Worker stores to, and the API serves images from. Default via Docker is `/Images`. |
| `LOCALIB_DISCOGS_CONSUMER_KEY`    | Both    | Consumer Key from [Discogs Developer Application][dcd], used by both the API and the worker.      |
| `LOCALIB_DISCOGS_CONSUMER_SECRET` | Both    | Consumer Secret from [Discogs Developer Application][dcd], used by both the API and the worker.   |
| `LOCALIB_DISCOGS_CALLBACK_URL`    | API     | Callback to the frontend's `/callback` URL to handle OAuth flow.                                  |
| `LOCALIB_CORS_ALLOWED_ORIGINS`    | API     | CORS restriction policy, optional, API only.                                                      |

Example:

```bash
docker run --rm \
  --name Localib \
  -e LOCALIB_DB_HOST=localhost \
  -e LOCALIB_DB_NAME=localib \
  -e LOCALIB_DB_USER=root \
  -e LOCALIB_DB_PASSWORD=password \
  -e LOCALIB_IMAGE_PATH=/Images \
  -e LOCALIB_DISCOGS_CONSUMER_KEY=somekeyvalue \
  -e LOCALIB_DISCOGS_CONSUMER_SECRET=somekeyvalue \
  -e LOCALIB_DISCOGS_CALLBACK_URL=https://localib.app/callback \
  -v "$(pwd)/Images:/Images" \
  -p 8080:8080 \
  ghcr.io/soup-bowl/localib/api:edge
```

Want to use a connection string? Replace all the DB fields with `-e LOCALIB_CONNECTION_STRING="Host=localhost;Database=postgres;Username=postgres;Password=password;"`.

### Testing Offline Capabilities

If you want to test the PWA functionality locally, you can add the following to the `VitePWA()` segment in `vite.config.ts`:

```js
devOptions: { enabled: true },
```

## Logo

The temporary logo utilises the **album-collection** icon from [Free icons](https://free-icons.github.io/free-icons/).

[dcd]: https://www.discogs.com/settings/developers

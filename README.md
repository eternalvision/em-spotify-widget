# em-spotify-widget

Spotify widgets that can be embedded on any site, built on [ECMact](https://github.com/eternalvision/ecmact), a small library of native Web Components with signals, styled components and a built-in HTTP client. A Cloudflare Worker reads your account through the Spotify Web API and serves the widgets.

Every widget can be embedded with a script and a custom element (Shadow DOM, themed through attributes and CSS variables) or with an `<iframe>` pointing at `/embed`. The now playing card also has a server-rendered image, `/card.svg`, that works in a README. The three variants look and move the same way and take the same options.

The root page of the deployed Worker is a configurator: pick a widget, tune it, see the script, iframe and image side by side and copy the code. The configurator is built with ECMact too, with custom controls and no native form elements.

## Built on ECMact

The whole front end is ECMact and nothing else: there is no other UI library, no CSS framework and no build-time templating.

| ECMact feature                 | Where it is used                                                              |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `defineWidget`                 | Every widget is a custom element registered once, with attributes as signals. |
| `tags`, `mount`                | All markup, including the configurator page and its controls.                 |
| `styled`, `keyframes`, `css`   | All styles: cards, rows, the spinning record, the equalizer, every control.   |
| `ThemeProvider`                | The resolved palette, radius, spacing and font reach every styled part.       |
| `signal`, `computed`, `effect` | Options, playback state, the progress, the dashboard state.                   |
| `createStore`                  | The now playing state (`select` gives signals for the card).                  |
| `createHttp`                   | Polling the Worker, with a timeout, a retry and cancellation.                 |
| `configure`                    | One shared stylesheet that makes the ECMact hosts layout-neutral.             |

The Worker serves the bundled `widget.js` (ECMact included, about 19 KB gzipped for all widgets) and the shared packages are plain TypeScript.

## Widgets

| Widget           | Element                 | Shows                                                    |
| ---------------- | ----------------------- | -------------------------------------------------------- |
| Now playing card | `<spotify-widget>`      | Cover, title, artist, waveform, listening bar and times. |
| Vinyl            | `<spotify-vinyl>`       | A spinning record with the cover as its label.           |
| Compact pill     | `<spotify-pill>`        | One row: cover, title, artist and a small equalizer.     |
| Recently played  | `<spotify-recent>`      | The last tracks with how long ago they played.           |
| Top tracks       | `<spotify-top-tracks>`  | Your most played tracks for a period.                    |
| Top artists      | `<spotify-top-artists>` | Your most played artists for a period.                   |
| Up next          | `<spotify-queue>`       | The queue after the current track.                       |
| Playlists        | `<spotify-playlists>`   | Your public playlists with their size.                   |
| Profile card     | `<spotify-profile>`     | Avatar, name and followers.                              |

## Packages

| Package           | What it holds                                                               |
| ----------------- | --------------------------------------------------------------------------- |
| `packages/shared` | Options and their parsing, palettes, texts, waveform timings, API types.    |
| `packages/worker` | The Cloudflare Worker: JSON endpoints, `/embed`, `/card.svg`, token script. |
| `packages/widget` | The ECMact widgets (`widget.js`) and the configurator page.                 |

## Develop

```bash
npm install
npm run build
npm run dev:worker
```

`dev:worker` serves everything on http://127.0.0.1:8790 with fake playback data (`MOCK`), so no Spotify keys are needed. For hot reload of the widgets and the configurator run `npm run dev:widget` in a second terminal (http://localhost:5180, it proxies the API to the Worker).

`npm run check` runs typecheck, lint, format check and all tests.

## Connect your Spotify account

The Worker needs a Spotify app and a refresh token for your account. Login uses PKCE, so there is no client secret.

1. In the [Spotify dashboard](https://developer.spotify.com/dashboard) create an app, tick **Web API** and add the redirect URI `http://127.0.0.1:8888/callback`.
2. Run the token script with the Client ID of the app. It opens a login address, waits for Spotify to call back and writes `packages/worker/.dev.vars` (git-ignored):

   ```bash
   SPOTIFY_CLIENT_ID=<your client id> npm run token -w @em-spotify/worker
   ```

   The script asks for these scopes: `user-read-currently-playing`, `user-read-playback-state`, `user-read-recently-played`, `user-top-read`, `user-read-private` and `playlist-read-private`. A token made earlier with fewer scopes keeps the now playing widgets working, but the list widgets say "Spotify is not available" until you run the script again.

3. Run the Worker against your account instead of the fake data:

   ```bash
   npm run dev:live -w @em-spotify/worker
   ```

For production, store the same two values as Worker secrets with `wrangler secret put SPOTIFY_CLIENT_ID` and `wrangler secret put SPOTIFY_REFRESH_TOKEN`. Rotated refresh tokens and access tokens are kept in the `TOKENS` KV namespace.

## Embed

```html
<script src="https://spotify-widget.example.com/widget.js"></script>
<spotify-widget theme="light" layout="horizontal"></spotify-widget>
<spotify-top-tracks count="5" range="long"></spotify-top-tracks>
```

```html
<iframe
  src="https://spotify-widget.example.com/embed?theme=light"
  width="320"
  height="508"
  style="border:0"
></iframe>
<iframe
  src="https://spotify-widget.example.com/embed?widget=recent&count=5"
  width="320"
  height="360"
  style="border:0"
></iframe>
```

```html
<img src="https://spotify-widget.example.com/card.svg?theme=light" alt="Spotify" />
```

`/embed` shows the now playing card unless `widget` names another one: `vinyl`, `pill`, `recent`, `top-tracks`, `top-artists`, `queue`, `playlists` or `profile`. The widget finds its API at the origin it was loaded from; set the `api` attribute to point it somewhere else. The configurator gives the iframe height for the options you picked.

## Options

The same names work as attributes of the elements and as query parameters of `/embed` and `/card.svg`. A widget ignores options that do not apply to it.

| Option         | Values                                                                                      | Default    | Widgets           |
| -------------- | ------------------------------------------------------------------------------------------- | ---------- | ----------------- |
| `theme`        | `dark`, `light`, `green`                                                                    | `dark`     | all               |
| `lang`         | `en`, `ru`, `uk`, `cs`                                                                      | `en`       | all               |
| `background`   | hex color, with or without `#`                                                              | by theme   | all               |
| `color`        | hex color of the text                                                                       | by theme   | all               |
| `accent`       | hex color of the dot, the logo and focus                                                    | by theme   | all               |
| `font`         | a font family, for example `Georgia, serif`                                                 | system     | all               |
| `radius`       | corner radius in px, 0 to 48 (the pill is fully round unless set)                           | `18`       | all               |
| `width`        | width in px, 200 to 640                                                                     | `320`      | all               |
| `refresh`      | seconds between updates, 3 to 300                                                           | `10`       | all               |
| `link`         | `false` turns off links to Spotify                                                          | `true`     | all               |
| `hide`         | comma list of parts to hide, see below                                                      | none       | all               |
| `layout`       | `vertical`, `horizontal`                                                                    | `vertical` | card              |
| `bars`         | hex color of the waveform that has not played yet                                           | accent     | card, pill        |
| `progress`     | hex color of the part that has played, and of the listening bar                             | accent     | card              |
| `cover-colors` | `true` takes accent, waveform and progress colors from the cover                            | `false`    | card, vinyl, pill |
| `cover-blur`   | `true` puts the cover behind the card, blurred                                              | `false`    | card              |
| `cover-bleed`  | `true` takes the padding away on the top, left and right, so the cover sits inside the card | `false`    | card              |
| `range`        | `short` (4 weeks), `medium` (6 months), `long` (all time)                                   | `medium`   | top lists         |
| `count`        | number of rows, 1 to 20                                                                     | `5`        | list widgets      |

Parts for `hide`: card `cover`, `title`, `artist`, `album`, `progress`, `equalizer`, `logo`, `label`; vinyl `cover`, `title`, `artist`, `logo`, `label`; pill `cover`, `title`, `artist`, `equalizer`, `logo`; lists `heading`, `cover`, `artist`, `meta`, `logo`; profile `cover`, `artist`, `logo`.

Explicit colors win over the cover colors, which win over the theme. On the elements the page can also override the look with CSS custom properties: `--widget-bg`, `--widget-text`, `--widget-accent`, `--widget-bars`, `--widget-progress`, `--widget-radius`, `--widget-font`.

Parts carry a `data-part` attribute (`card`, `cover`, `title`, `artist`, `album`, `equalizer`, `progress`, `elapsed`, `total`, `row`, `heading`, ...), and the card carries `data-state` (`playing`, `paused`, `idle`), `data-layout`, `data-blur` and `data-bleed`.

## Notes

- **Waveform.** The bars are also the progress: the part that has played is lit, and the listening bar with the two times sits under it (`progress` hides them and lights every bar). Every bar swings in its own endless cycle, the same in the script, the iframe and the image. Spotify has closed its audio analysis endpoints to new apps, so the bars do not follow the real sound: they depend only on the track and freeze on pause.
- **Cover colors in the image.** The Worker decodes the small JPEG cover of the track (with `jpeg-js`, which needs the `nodejs_compat` flag set in `wrangler.jsonc`) and takes the same accent as the widget does.
- **Not playing.** When nothing plays the cards show only the "Not playing" text and the logo.
- **Iframe on dark pages.** A page that sets `color-scheme: dark` makes browsers paint an opaque background behind a transparent iframe. Use the script embed there.
- **Updates.** The Worker caches Spotify answers for a few seconds (now playing, queue), half a minute (recently played) or ten minutes (top lists, playlists, profile).
- **Playlists.** Only public playlists are shown.

## Documentation

- [Architecture](docs/architecture.md): packages, data flow and how ECMact is used.
- [API](docs/api.md): the Worker endpoints, their parameters, answers and caching.
- [Deployment](docs/deployment.md): setting the Worker up on Cloudflare with your own domain.

## License

The widgets are built on [ECMact](https://github.com/eternalvision/ecmact), which is MIT licensed.

## Later

Today the Worker serves one Spotify account, the owner's. Letting anyone sign in with Spotify and get their own widgets is a possible next step; it needs a login flow and storage of per-user tokens.

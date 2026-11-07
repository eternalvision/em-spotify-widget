# Architecture

The project is an npm workspaces monorepo. The front end is built on [ECMact](https://github.com/eternalvision/ecmact); the back end is one Cloudflare Worker.

```
Spotify Web API
      |  (refresh token in Worker secrets, access token in KV)
      v
Cloudflare Worker  ------------------------------+
  /api/*      JSON answers, cached for seconds     |
  /embed      a page that holds one widget         |  serves
  /card.svg   the now playing card as an image     |
  /           the configurator, /widget.js         v
      ^                                    packages/widget (dist)
      |  fetch every `refresh` seconds
<spotify-widget>, <spotify-recent>, ...   (custom elements on any site)
```

## Packages

| Package           | Role                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `packages/shared` | Code both sides need: options and their parsing, palettes, texts, waveform timings, API types. |
| `packages/worker` | The Worker, the Spotify client, the SVG renderer and the token script.                         |
| `packages/widget` | The ECMact widgets, built to one `widget.js`, and the configurator page.                       |

Imports inside a package use its own alias (`#shared/*`, `#worker/*`, `#widget/*`); other packages are imported by name (`@em-spotify/shared/options`). Tests live in a `test` folder of each package.

## One set of options, three outputs

`packages/shared/src/options.ts` is the single definition of every option: its name, its allowed values, its limits and its default. `parseOptions` reads them from anything that can give a string by name, so the same code serves:

- the attributes of a custom element (`<spotify-widget theme="light">`),
- the query of `/embed` and `/card.svg`,
- the configurator, which builds the snippets from the same names.

Bad values fall back to defaults and numbers are clamped, so an address typed by hand never breaks a widget.

`palette.ts` turns the options into colors (theme, then colors from the cover, then explicit colors). `equalizer.ts` gives every track its own set of bar timings. Both are used by the widget and by the SVG renderer, which is what keeps the script, the iframe and the image looking and moving the same.

## The widgets

Each widget is a custom element made with `defineWidget`. Its attributes arrive as signals, and `parseOptions` turns them into one `computed` options object. Everything below reacts to that object, so changing an attribute on a live page updates the widget without a reload.

- **Data.** `lib/poller.ts` polls the Worker with `createHttp` (timeout, one retry, cancellation). It pauses while the tab is hidden and resumes at once when it is shown. List widgets share `lib/live.ts`, which keeps the data and a `failed` flag as signals.
- **State.** The now playing widgets keep their state in a `createStore`; its `select` gives the signals the markup binds to.
- **Styles.** Parts are `styled` components. `ThemeProvider` carries the resolved palette, radius, padding, gap and font, so a template reads `theme.accent` and restyles when the theme signal changes. A page can still override the look with `--widget-*` custom properties.
- **Layout.** Styled components each get their own Shadow DOM. A shared stylesheet (`configure({ styles })`) sets `:host { display: contents }`, so the ECMact hosts disappear from the layout and the real elements sit in one flex or grid container.
- **Fade in.** A widget stays transparent until the first answer (or the first failure) arrives, so it never flashes "Not playing" while it loads.

### The now playing card

- The waveform is 40 bars. Each bar has its own endless CSS animation (`@keyframes` with custom properties set per track from `barTimings`), so the cycle is the same whether it is drawn by the widget or by the SVG.
- The bars are also the progress. A frame loop lights the played ones and updates the listening bar and the times between polls; the next poll only corrects the position. `wave-progress` and `progress` are separate parts of `hide`: the first lights every bar, the second removes the listening bar and the times.
- Three layouts: `vertical`, `horizontal` and `square`. In the square one the cover is absolute and fills the card, a `Scrim` layer fades the card background over its top and bottom, the status row is pinned to the top and the text sits at the bottom. It applies only while a track is known, so the idle card stays compact. `cover-blur` and `cover-bleed` do not apply to it.
- Track change (`lib/swap.ts`): when the track id changes, the text rows rise in one after another (Web Animations API, skipped with `prefers-reduced-motion`), the backdrop fades in, and a ghost copy of the previous cover is laid over the new one and fades out, which is a cross-fade.
- `cover-colors` reads the cover on a canvas (`lib/cover-color.ts`) and takes an accent with the shared `accentOfPixels`. The Worker uses the same function on the decoded JPEG for the image.
- `cover-blur` and `cover-bleed` are plain styled-component states: a blurred backdrop layer and a zero-padding card with the spacing moved to the body.

## The Worker

- **Routes.** `/api/*` returns JSON with CORS, `/embed` returns a page with the widget named in the query, `/card.svg` returns the image. Everything else is served from the built widget package (assets binding).
- **Spotify access.** `spotify/token.ts` refreshes the access token with PKCE (no client secret) and keeps the access token and the rotated refresh token in KV. A token is ignored when the refresh token secret changed, so replacing the secret takes effect at once.
- **Caching.** `cache.ts` caches parsed answers in the Cache API for a few seconds up to ten minutes, depending on the data. Cached now playing answers move the progress forward by the age of the cache.
- **Mock mode.** With `MOCK=true` every endpoint returns generated data, so the whole stack runs without Spotify keys.
- **The image.** `card/svg.ts` draws the card as SVG text, laid out to match the widget (the same line heights, spacing and gaps). The cover is inlined as a data URI because an SVG used as an image cannot load other files. Animations are CSS inside the SVG. For `cover-colors` the Worker decodes the small cover with `jpeg-js`.
- **Elapsed time in the image.** An image cannot run script, so the elapsed time is drawn as digit strips (`rolling` in `svg.ts`): a nested `<svg>` clips one digit and a `steps()` animation with a negative delay moves the strip to the right digit and on every second, ten seconds and minute. A plain text copy is shown under `prefers-reduced-motion`.
- **Text width.** `fitText` in `card/xml.ts` measures a title with a table of glyph widths (Arial metrics, a little wider for bold) instead of one average width.
- **Square layout.** `squareCard` places the cover over the whole card with a gradient, pins the status row to the top and stacks the text from the bottom; its height is the width unless the text needs more.

## The configurator

`packages/widget/src/configurator` is an ECMact page with its own controls: a select, a slider, switches and chips, tabs, a text field on `contenteditable` and a color field with presets. None of them is a native form element; they carry ARIA roles and work with the keyboard. `support.ts` says which options each widget understands, and the snippets (`snippets.ts`) only contain those.

## Checks

`npm run check` runs typecheck, ESLint, Prettier and all Vitest suites (the widget in happy-dom, the Worker and the shared package in Node). The Worker tests stub `fetch` for Spotify and use a small in-memory KV.

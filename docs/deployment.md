# Deployment

The Worker and the built widgets deploy together as one Cloudflare Worker with static assets. These steps need a Cloudflare account that holds your domain; nothing here runs by itself, you run each command.

## 1. Spotify app

1. In the [Spotify dashboard](https://developer.spotify.com/dashboard) create an app and tick **Web API**.
2. Add the redirect URI `http://127.0.0.1:8888/callback`. Use `127.0.0.1`, not `localhost`.
3. Copy the Client ID. The Client Secret is not needed: login uses PKCE.

## 2. A refresh token

```bash
SPOTIFY_CLIENT_ID=<your client id> npm run token -w @em-spotify/worker
```

The script prints a Spotify address. Open it, approve the access and the script writes `packages/worker/.dev.vars`, which is git-ignored. The script asks for these scopes:

- `user-read-currently-playing`
- `user-read-playback-state`
- `user-read-recently-played`
- `user-top-read`
- `user-read-private`
- `playlist-read-private`

Run it again whenever you add a scope.

## 3. Check locally

```bash
npm install
npm run build
npm run dev:live -w @em-spotify/worker
```

Open http://127.0.0.1:8790. `dev:live` uses `.dev.vars`; `npm run dev:worker` uses generated data instead.

## 4. Cloudflare resources

Log in once:

```bash
npx wrangler login
```

Create the KV namespace that holds the access token and the rotated refresh token, and put its id into `packages/worker/wrangler.jsonc`:

```bash
npx wrangler kv namespace create TOKENS
```

```jsonc
"kv_namespaces": [{ "binding": "TOKENS", "id": "<the id wrangler printed>" }]
```

Store the two secrets. The word after `put` is the **name** of the secret, exactly as written below; wrangler then asks for the value, so it never lands in your shell history (do not type the value after `put`, that creates a secret with the wrong name):

```bash
cd packages/worker
npx wrangler secret put SPOTIFY_CLIENT_ID
npx wrangler secret put SPOTIFY_REFRESH_TOKEN
```

The values are the ones in `.dev.vars`: the Client ID and the refresh token. `npx wrangler secret list` shows the names that are set; it must show exactly `SPOTIFY_CLIENT_ID` and `SPOTIFY_REFRESH_TOKEN`. A wrongly named secret is removed with `npx wrangler secret delete <name>`.

## 5. Your domain

Add a custom domain route to `packages/worker/wrangler.jsonc`. The zone has to be on your Cloudflare account:

```jsonc
"routes": [{ "pattern": "spotify-widget.example.com", "custom_domain": true }]
```

## 6. Deploy

```bash
npm run build
cd packages/worker
npx wrangler deploy
```

`wrangler.jsonc` already has `MOCK` set to `"false"`, the assets folder (`../widget/dist`), the `nodejs_compat` flag that the JPEG decoder needs, and Workers Logs and traces.

## 7. Check the result

```bash
curl https://spotify-widget.example.com/api/now-playing
```

Then open the root address, pick a widget and copy its code. The snippets use the address of the page they were made on, so make them on the deployed domain.

## Changing things later

- **A new scope.** Add it to `scope` in `packages/worker/scripts/get-refresh-token.ts`, run the token script again and put the new refresh token into the secret.
- **A new refresh token.** `wrangler secret put SPOTIFY_REFRESH_TOKEN`. The Worker notices that the secret changed and ignores the token kept in KV.
- **A new widget build.** `npm run build`, then `npx wrangler deploy`. The widget script is cached by browsers like any asset, so give the script tag a version query when you need an update to show at once.
- **Logs.** Workers Logs are on; open the Worker in the Cloudflare dashboard, or run `npx wrangler tail`.

## Limits to know

- The Workers Free plan allows 10 ms of CPU per request. Decoding a 64 px cover for `cover-colors` in the image is small, but if the plan is too tight for it, `cover-colors` still works in the script and the iframe.
- Answers are cached per Worker location, so a change in Spotify can take a few seconds (now playing, queue) or up to ten minutes (top lists, playlists, profile) to show.
- Spotify apps in development mode have their own limits on users and endpoints. This project reads one account, yours.

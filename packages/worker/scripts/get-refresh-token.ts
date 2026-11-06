import { createHash, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { createServer } from 'node:http';

const clientId = process.env.SPOTIFY_CLIENT_ID;
const port = 8888;
const redirectUri = `http://127.0.0.1:${port}/callback`;
const scope = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-read-recently-played',
  'user-top-read',
  'user-read-private',
  'playlist-read-private',
].join(' ');

if (!clientId) {
  console.error(
    'Set SPOTIFY_CLIENT_ID first: SPOTIFY_CLIENT_ID=... npm run token -w @em-spotify/worker',
  );
  process.exit(1);
}

const verifier = randomBytes(48).toString('base64url');
const challenge = createHash('sha256').update(verifier).digest('base64url');
const state = randomBytes(12).toString('hex');

const authorizeUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
  client_id: clientId,
  response_type: 'code',
  redirect_uri: redirectUri,
  scope,
  state,
  code_challenge_method: 'S256',
  code_challenge: challenge,
}).toString()}`;

const exchange = async (code: string): Promise<string> => {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
    }),
  });
  const body: unknown = await response.json();
  const token =
    typeof body === 'object' && body !== null && 'refresh_token' in body
      ? body.refresh_token
      : null;
  if (!response.ok || typeof token !== 'string') {
    throw new Error(`token exchange failed with ${response.status}`);
  }
  return token;
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', redirectUri);
  if (url.pathname !== '/callback') {
    response.writeHead(404).end();
    return;
  }
  const code = url.searchParams.get('code');
  if (url.searchParams.get('state') !== state || !code) {
    response.writeHead(400).end('Authorization failed. Return to the terminal.');
    server.close();
    return;
  }
  exchange(code)
    .then((refreshToken) => {
      writeFileSync(
        new URL('../.dev.vars', import.meta.url),
        `SPOTIFY_CLIENT_ID=${clientId}\nSPOTIFY_REFRESH_TOKEN=${refreshToken}\n`,
        { mode: 0o600 },
      );
      response.writeHead(200).end('Done. You can close this tab and return to the terminal.');
      process.stdout.write(
        'Saved packages/worker/.dev.vars (git-ignored). For production use wrangler secret put.\n',
      );
    })
    .catch((error: unknown) => {
      response.writeHead(500).end('Token exchange failed. See the terminal.');
      console.error(error);
    })
    .finally(() => {
      server.close();
    });
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Open this address and approve access:\n\n${authorizeUrl}\n\n`);
});

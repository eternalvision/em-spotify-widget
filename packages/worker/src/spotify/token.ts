import { isRecord, numberOf, textOf } from '@em-spotify/shared/guards';

const tokenUrl = 'https://accounts.spotify.com/api/token';
const storageKey = 'token';
const safetyMs = 60_000;

interface StoredToken {
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
  seed: string;
}

const storedOf = (value: unknown): StoredToken | null => {
  if (!isRecord(value)) {
    return null;
  }
  const accessToken = textOf(value.accessToken);
  const refreshToken = textOf(value.refreshToken);
  const seed = textOf(value.seed);
  const expiresAt = numberOf(value.expiresAt);
  return accessToken && refreshToken && seed && expiresAt !== null
    ? { accessToken, expiresAt, refreshToken, seed }
    : null;
};

const seedOf = async (secret: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const refresh = async (
  clientId: string,
  refreshToken: string,
  seed: string,
  now: number,
): Promise<StoredToken> => {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });
  if (!response.ok) {
    throw new Error(`spotify token refresh failed with ${response.status}`);
  }
  const body: unknown = await response.json();
  const accessToken = isRecord(body) ? textOf(body.access_token) : null;
  const lifetime = isRecord(body) ? numberOf(body.expires_in) : null;
  if (!accessToken || lifetime === null) {
    throw new Error('spotify token refresh returned an unexpected body');
  }
  return {
    accessToken,
    expiresAt: now + lifetime * 1000,
    refreshToken: (isRecord(body) ? textOf(body.refresh_token) : null) ?? refreshToken,
    seed,
  };
};

export const accessTokenOf = async (env: Env, now: number): Promise<string> => {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_REFRESH_TOKEN) {
    throw new Error('spotify credentials are not configured');
  }
  const seed = await seedOf(env.SPOTIFY_REFRESH_TOKEN);
  const stored = storedOf(await env.TOKENS.get(storageKey, 'json'));
  const current = stored?.seed === seed ? stored : null;
  if (current && current.expiresAt - safetyMs > now) {
    return current.accessToken;
  }
  const next = await refresh(
    env.SPOTIFY_CLIENT_ID,
    current?.refreshToken ?? env.SPOTIFY_REFRESH_TOKEN,
    seed,
    now,
  );
  await env.TOKENS.put(storageKey, JSON.stringify(next));
  return next.accessToken;
};

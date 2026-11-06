import { afterEach, describe, expect, it, vi } from 'vitest';
import { accessTokenOf } from '#worker/spotify/token.ts';

const memoryKv = () => {
  const store = new Map<string, string>();
  return {
    get: (key: string) =>
      Promise.resolve(store.has(key) ? JSON.parse(store.get(key) ?? 'null') : null),
    put: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
  };
};

const envOf = (kv = memoryKv(), refreshToken = 'refresh-1') =>
  ({
    SPOTIFY_CLIENT_ID: 'client',
    SPOTIFY_REFRESH_TOKEN: refreshToken,
    TOKENS: kv,
  }) as unknown as Env;

const bodyOf = (call: unknown[] | undefined): string => {
  const init = call?.[1];
  const body = typeof init === 'object' && init !== null && 'body' in init ? init.body : null;
  return body instanceof URLSearchParams ? body.toString() : '';
};

const tokenResponse = (body: Record<string, unknown>) =>
  Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('accessTokenOf', () => {
  it('refreshes once and then reuses the stored token', async () => {
    const fetchMock = vi.fn(() => tokenResponse({ access_token: 'access-1', expires_in: 3600 }));
    vi.stubGlobal('fetch', fetchMock);
    const env = envOf();
    expect(await accessTokenOf(env, 0)).toBe('access-1');
    expect(await accessTokenOf(env, 1000)).toBe('access-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends the refresh token and the client id without a secret', async () => {
    const fetchMock = vi.fn((_url: string, _init: RequestInit) =>
      tokenResponse({ access_token: 'a', expires_in: 3600 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await accessTokenOf(envOf(), 0);
    const body = bodyOf(fetchMock.mock.calls[0]);
    expect(body).toContain('grant_type=refresh_token');
    expect(body).toContain('client_id=client');
    expect(body).not.toContain('secret');
  });

  it('keeps the rotated refresh token for the next refresh', async () => {
    const fetchMock = vi
      .fn((_url: string, _init: RequestInit) => tokenResponse({}))
      .mockImplementationOnce(() =>
        tokenResponse({ access_token: 'a1', expires_in: 10, refresh_token: 'refresh-2' }),
      )
      .mockImplementationOnce(() => tokenResponse({ access_token: 'a2', expires_in: 3600 }));
    vi.stubGlobal('fetch', fetchMock);
    const env = envOf();
    await accessTokenOf(env, 0);
    expect(await accessTokenOf(env, 120_000)).toBe('a2');
    expect(bodyOf(fetchMock.mock.calls[1])).toContain('refresh_token=refresh-2');
  });

  it('ignores a stored token made from another secret', async () => {
    const fetchMock = vi.fn(() => tokenResponse({ access_token: 'fresh', expires_in: 3600 }));
    vi.stubGlobal('fetch', fetchMock);
    const kv = memoryKv();
    await accessTokenOf(envOf(kv, 'old'), 0);
    expect(await accessTokenOf(envOf(kv, 'new'), 1000)).toBe('fresh');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails when Spotify refuses', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('no', { status: 400 })));
    await expect(accessTokenOf(envOf(), 0)).rejects.toThrow('400');
  });

  it('fails without credentials', async () => {
    await expect(accessTokenOf({ TOKENS: memoryKv() } as unknown as Env, 0)).rejects.toThrow(
      'not configured',
    );
  });
});

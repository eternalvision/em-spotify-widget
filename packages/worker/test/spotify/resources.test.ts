import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  loadPlaylists,
  loadProfile,
  loadQueue,
  loadRecent,
  loadTopArtists,
  loadTopTracks,
} from '#worker/spotify/resources.ts';

const track = (id: string) => ({
  id,
  name: `Song ${id}`,
  duration_ms: 1000,
  artists: [{ name: 'A' }],
  album: { name: 'Album', images: [{ url: `https://img/${id}` }] },
  external_urls: { spotify: `https://open.spotify.com/track/${id}` },
});

const kv = { get: () => Promise.resolve(null), put: () => Promise.resolve() };

const env = {
  SPOTIFY_CLIENT_ID: 'client',
  SPOTIFY_REFRESH_TOKEN: 'refresh',
  TOKENS: kv,
} as unknown as Env;
const ctx = {
  waitUntil: () => undefined,
  passThroughOnException: () => undefined,
} as unknown as ExecutionContext;

const serve = (routes: Record<string, unknown>) => {
  const fetchMock = vi.fn((input: unknown) => {
    const { pathname } = new URL(String(input));
    const body =
      pathname === '/api/token' ? { access_token: 't', expires_in: 3600 } : routes[pathname];
    return Promise.resolve(
      body === undefined
        ? new Response('missing', { status: 404 })
        : new Response(JSON.stringify(body)),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('spotify resources', () => {
  it('maps the recently played tracks with their time', async () => {
    serve({
      '/v1/me/player/recently-played': {
        items: [{ track: track('1'), played_at: '2026-11-06T10:00:00Z' }, { track: null }],
      },
    });
    const result = await loadRecent(env, ctx);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      playedAt: Date.parse('2026-11-06T10:00:00Z'),
      track: { id: '1', title: 'Song 1', artists: ['A'], coverUrl: 'https://img/1' },
    });
  });

  it('asks for the period of the top lists', async () => {
    const fetchMock = serve({ '/v1/me/top/tracks': { items: [track('1')] } });
    await loadTopTracks(env, ctx, 'short');
    expect(String(fetchMock.mock.calls.at(-1)?.[0])).toContain('time_range=short_term');
    await loadTopTracks(env, ctx, 'long');
    expect(String(fetchMock.mock.calls.at(-1)?.[0])).toContain('time_range=long_term');
  });

  it('maps top artists with photo, genres and followers', async () => {
    serve({
      '/v1/me/top/artists': {
        items: [
          {
            id: 'a1',
            name: 'Artist',
            genres: ['indie', 5],
            images: [{ url: 'https://img/a1' }],
            followers: { total: 42 },
            external_urls: { spotify: 'https://open.spotify.com/artist/a1' },
          },
        ],
      },
    });
    const result = await loadTopArtists(env, ctx, 'medium');
    expect(result.items[0]).toEqual({
      id: 'a1',
      name: 'Artist',
      imageUrl: 'https://img/a1',
      url: 'https://open.spotify.com/artist/a1',
      genres: ['indie'],
      followers: 42,
    });
  });

  it('maps the queue with the current track', async () => {
    serve({
      '/v1/me/player/queue': { currently_playing: track('now'), queue: [track('1'), track('2')] },
    });
    const result = await loadQueue(env, ctx);
    expect(result.current?.id).toBe('now');
    expect(result.next.map((item) => item.id)).toEqual(['1', '2']);
  });

  it('maps the profile and falls back to the id for the name', async () => {
    serve({ '/v1/me': { id: 'user1', images: [], followers: { total: 7 } } });
    const result = await loadProfile(env, ctx);
    expect(result).toMatchObject({
      id: 'user1',
      name: 'user1',
      imageUrl: null,
      followers: 7,
      url: 'https://open.spotify.com/user/user1',
    });
  });

  it('keeps only public playlists and reads their size', async () => {
    serve({
      '/v1/me/playlists': {
        items: [
          { id: 'p1', name: 'Public', public: true, tracks: { total: 12 }, images: [] },
          { id: 'p2', name: 'Private', public: false, tracks: { total: 3 }, images: [] },
          { id: 'p3', name: 'New shape', public: true, items: { total: 9 }, images: [] },
        ],
      },
    });
    const result = await loadPlaylists(env, ctx);
    expect(result.items.map((item) => [item.id, item.tracks])).toEqual([
      ['p1', 12],
      ['p3', 9],
    ]);
  });

  it('fails when Spotify refuses', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('no', { status: 403 })));
    await expect(loadRecent(env, ctx)).rejects.toThrow('403');
  });
});

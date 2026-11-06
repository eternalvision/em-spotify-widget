import { isRecord, listOf, numberOf, textOf } from '@em-spotify/shared/guards';
import {
  parsePlaylists,
  parseProfile,
  parseQueue,
  parseRecent,
  parseTopArtists,
  parseTopTracks,
} from '@em-spotify/shared/parse';
import type {
  ArtistSummary,
  Playlists,
  PlaylistSummary,
  Profile,
  Queue,
  Recent,
  TopArtists,
  TopTracks,
} from '@em-spotify/shared/types';
import { cachedJson } from '#worker/cache.ts';
import { isMock } from '#worker/env.ts';
import { spotifyGet } from '#worker/spotify/client.ts';
import { firstImage, summaryOf } from '#worker/spotify/items.ts';
import {
  mockPlaylists,
  mockProfile,
  mockQueue,
  mockRecent,
  mockTopArtists,
  mockTopTracks,
} from '#worker/spotify/mock-data.ts';

export type Range = 'short' | 'medium' | 'long';

const rangeParam: Record<Range, string> = {
  short: 'short_term',
  medium: 'medium_term',
  long: 'long_term',
};

const linkOf = (value: Record<string, unknown>): string | null =>
  isRecord(value.external_urls) ? textOf(value.external_urls.spotify) : null;

const recentOf = (body: unknown, now: number): Recent => ({
  fetchedAt: now,
  items: (isRecord(body) ? listOf(body.items) : []).flatMap((entry) => {
    const track = isRecord(entry) ? summaryOf(entry.track) : null;
    const playedAt = isRecord(entry) ? Date.parse(textOf(entry.played_at) ?? '') : Number.NaN;
    return track && Number.isFinite(playedAt) ? [{ track, playedAt }] : [];
  }),
});

const topTracksOf = (body: unknown, now: number): TopTracks => ({
  fetchedAt: now,
  items: (isRecord(body) ? listOf(body.items) : []).flatMap((item) => {
    const track = summaryOf(item);
    return track ? [track] : [];
  }),
});

const artistOf = (item: unknown): ArtistSummary | null => {
  if (!isRecord(item)) {
    return null;
  }
  const id = textOf(item.id);
  const name = textOf(item.name);
  if (!id || !name) {
    return null;
  }
  return {
    id,
    name,
    imageUrl: firstImage(item),
    url: linkOf(item) ?? `https://open.spotify.com/artist/${id}`,
    genres: listOf(item.genres).filter((genre): genre is string => typeof genre === 'string'),
    followers: isRecord(item.followers) ? (numberOf(item.followers.total) ?? 0) : 0,
  };
};

const topArtistsOf = (body: unknown, now: number): TopArtists => ({
  fetchedAt: now,
  items: (isRecord(body) ? listOf(body.items) : []).flatMap((item) => {
    const artist = artistOf(item);
    return artist ? [artist] : [];
  }),
});

const queueOf = (body: unknown, now: number): Queue => ({
  fetchedAt: now,
  current: isRecord(body) ? summaryOf(body.currently_playing) : null,
  next: (isRecord(body) ? listOf(body.queue) : []).flatMap((item) => {
    const track = summaryOf(item);
    return track ? [track] : [];
  }),
});

const profileOf = (body: unknown, now: number): Profile => {
  const user = isRecord(body) ? body : {};
  const id = textOf(user.id) ?? 'unknown';
  return {
    id,
    name: textOf(user.display_name) ?? id,
    imageUrl: firstImage(user),
    url: linkOf(user) ?? `https://open.spotify.com/user/${id}`,
    followers: isRecord(user.followers) ? (numberOf(user.followers.total) ?? 0) : 0,
    fetchedAt: now,
  };
};

const playlistOf = (item: unknown): PlaylistSummary | null => {
  if (!isRecord(item) || item.public !== true) {
    return null;
  }
  const id = textOf(item.id);
  const name = textOf(item.name);
  if (!id || !name) {
    return null;
  }
  const counts = isRecord(item.tracks) ? item.tracks : isRecord(item.items) ? item.items : {};
  return {
    id,
    name,
    imageUrl: firstImage(item),
    url: linkOf(item) ?? `https://open.spotify.com/playlist/${id}`,
    tracks: numberOf(counts.total) ?? 0,
  };
};

const playlistsOf = (body: unknown, now: number): Playlists => ({
  fetchedAt: now,
  items: (isRecord(body) ? listOf(body.items) : [])
    .flatMap((item) => {
      const playlist = playlistOf(item);
      return playlist ? [playlist] : [];
    })
    .slice(0, 20),
});

export const loadRecent = async (env: Env, ctx: ExecutionContext): Promise<Recent> => {
  const now = Date.now();
  if (isMock(env)) {
    return mockRecent(now);
  }
  const { value } = await cachedJson(ctx, 'recent', 30, parseRecent, async () =>
    recentOf(await spotifyGet(env, '/me/player/recently-played?limit=20', now), now),
  );
  return value;
};

export const loadTopTracks = async (
  env: Env,
  ctx: ExecutionContext,
  range: Range,
): Promise<TopTracks> => {
  const now = Date.now();
  if (isMock(env)) {
    return mockTopTracks(now);
  }
  const { value } = await cachedJson(ctx, `top-tracks-${range}`, 600, parseTopTracks, async () =>
    topTracksOf(
      await spotifyGet(env, `/me/top/tracks?time_range=${rangeParam[range]}&limit=20`, now),
      now,
    ),
  );
  return value;
};

export const loadTopArtists = async (
  env: Env,
  ctx: ExecutionContext,
  range: Range,
): Promise<TopArtists> => {
  const now = Date.now();
  if (isMock(env)) {
    return mockTopArtists(now);
  }
  const { value } = await cachedJson(ctx, `top-artists-${range}`, 600, parseTopArtists, async () =>
    topArtistsOf(
      await spotifyGet(env, `/me/top/artists?time_range=${rangeParam[range]}&limit=20`, now),
      now,
    ),
  );
  return value;
};

export const loadQueue = async (env: Env, ctx: ExecutionContext): Promise<Queue> => {
  const now = Date.now();
  if (isMock(env)) {
    return mockQueue(now);
  }
  const { value } = await cachedJson(ctx, 'queue', 5, parseQueue, async () =>
    queueOf(await spotifyGet(env, '/me/player/queue', now), now),
  );
  return value;
};

export const loadProfile = async (env: Env, ctx: ExecutionContext): Promise<Profile> => {
  const now = Date.now();
  if (isMock(env)) {
    return mockProfile(now);
  }
  const { value } = await cachedJson(ctx, 'profile', 600, parseProfile, async () =>
    profileOf(await spotifyGet(env, '/me', now), now),
  );
  return value;
};

export const loadPlaylists = async (env: Env, ctx: ExecutionContext): Promise<Playlists> => {
  const now = Date.now();
  if (isMock(env)) {
    return mockPlaylists(now);
  }
  const { value } = await cachedJson(ctx, 'playlists', 600, parsePlaylists, async () =>
    playlistsOf(await spotifyGet(env, '/me/playlists?limit=50', now), now),
  );
  return value;
};

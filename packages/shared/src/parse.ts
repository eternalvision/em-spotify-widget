import { isRecord, listOf, numberOf, textOf } from '#shared/guards.ts';
import type {
  ArtistSummary,
  NowPlaying,
  PlaybackState,
  Playlists,
  PlaylistSummary,
  Profile,
  Queue,
  Recent,
  TopArtists,
  TopTracks,
  Track,
  TrackSummary,
} from '#shared/types.ts';

const stateOf = (value: unknown): PlaybackState | null =>
  value === 'playing' || value === 'paused' || value === 'idle' ? value : null;

const trackOf = (value: unknown): Track | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = textOf(value.id);
  const title = textOf(value.title);
  const url = textOf(value.url);
  const durationMs = numberOf(value.durationMs);
  const progressMs = numberOf(value.progressMs);
  if (!id || !title || !url || durationMs === null || durationMs <= 0 || progressMs === null) {
    return null;
  }
  return {
    id,
    title,
    url,
    durationMs,
    progressMs,
    artists: listOf(value.artists).filter((item): item is string => typeof item === 'string'),
    album: typeof value.album === 'string' ? value.album : '',
    coverUrl: textOf(value.coverUrl),
    thumbUrl: textOf(value.thumbUrl),
  };
};

export const parseNowPlaying = (value: unknown): NowPlaying | null => {
  if (!isRecord(value)) {
    return null;
  }
  const state = stateOf(value.state);
  const fetchedAt = numberOf(value.fetchedAt);
  const track = trackOf(value.track);
  if (state === null || fetchedAt === null || (state !== 'idle' && track === null)) {
    return null;
  }
  return { state, fetchedAt, track: state === 'idle' ? null : track };
};

const summaryOf = (value: unknown): TrackSummary | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = textOf(value.id);
  const title = textOf(value.title);
  const url = textOf(value.url);
  const durationMs = numberOf(value.durationMs);
  if (!id || !title || !url || durationMs === null) {
    return null;
  }
  return {
    id,
    title,
    url,
    durationMs,
    artists: listOf(value.artists).filter((item): item is string => typeof item === 'string'),
    album: typeof value.album === 'string' ? value.album : '',
    coverUrl: textOf(value.coverUrl),
    thumbUrl: textOf(value.thumbUrl),
  };
};

const itemsOf = <T>(value: unknown, read: (item: unknown) => T | null): T[] | null => {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return null;
  }
  return value.items.flatMap((item) => {
    const parsed = read(item);
    return parsed === null ? [] : [parsed];
  });
};

const stampOf = (value: unknown): number | null =>
  isRecord(value) ? numberOf(value.fetchedAt) : null;

export const parseRecent = (value: unknown): Recent | null => {
  const fetchedAt = stampOf(value);
  const items = itemsOf(value, (item) => {
    if (!isRecord(item)) {
      return null;
    }
    const track = summaryOf(item.track);
    const playedAt = numberOf(item.playedAt);
    return track && playedAt !== null ? { track, playedAt } : null;
  });
  return fetchedAt === null || items === null ? null : { items, fetchedAt };
};

export const parseTopTracks = (value: unknown): TopTracks | null => {
  const fetchedAt = stampOf(value);
  const items = itemsOf(value, summaryOf);
  return fetchedAt === null || items === null ? null : { items, fetchedAt };
};

const artistOf = (value: unknown): ArtistSummary | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = textOf(value.id);
  const name = textOf(value.name);
  const url = textOf(value.url);
  if (!id || !name || !url) {
    return null;
  }
  return {
    id,
    name,
    url,
    imageUrl: textOf(value.imageUrl),
    genres: listOf(value.genres).filter((item): item is string => typeof item === 'string'),
    followers: numberOf(value.followers) ?? 0,
  };
};

export const parseTopArtists = (value: unknown): TopArtists | null => {
  const fetchedAt = stampOf(value);
  const items = itemsOf(value, artistOf);
  return fetchedAt === null || items === null ? null : { items, fetchedAt };
};

export const parseQueue = (value: unknown): Queue | null => {
  const fetchedAt = stampOf(value);
  const next = itemsOf({ items: isRecord(value) ? value.next : null }, summaryOf);
  if (fetchedAt === null || next === null || !isRecord(value)) {
    return null;
  }
  return { current: summaryOf(value.current), next, fetchedAt };
};

export const parseProfile = (value: unknown): Profile | null => {
  const fetchedAt = stampOf(value);
  if (fetchedAt === null || !isRecord(value)) {
    return null;
  }
  const id = textOf(value.id);
  const name = textOf(value.name);
  const url = textOf(value.url);
  if (!id || !name || !url) {
    return null;
  }
  return {
    id,
    name,
    url,
    imageUrl: textOf(value.imageUrl),
    followers: numberOf(value.followers) ?? 0,
    fetchedAt,
  };
};

export const parsePlaylists = (value: unknown): Playlists | null => {
  const fetchedAt = stampOf(value);
  const items = itemsOf(value, (item): PlaylistSummary | null => {
    if (!isRecord(item)) {
      return null;
    }
    const id = textOf(item.id);
    const name = textOf(item.name);
    const url = textOf(item.url);
    return id && name && url
      ? { id, name, url, imageUrl: textOf(item.imageUrl), tracks: numberOf(item.tracks) ?? 0 }
      : null;
  });
  return fetchedAt === null || items === null ? null : { items, fetchedAt };
};

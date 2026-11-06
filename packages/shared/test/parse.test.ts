import { describe, expect, it } from 'vitest';
import {
  parseNowPlaying,
  parsePlaylists,
  parseProfile,
  parseQueue,
  parseRecent,
  parseTopArtists,
  parseTopTracks,
} from '#shared/parse.ts';

const track = {
  id: 't1',
  title: 'Song',
  artists: ['A', 'B'],
  album: 'Album',
  coverUrl: 'https://img',
  thumbUrl: null,
  url: 'https://open.spotify.com/track/t1',
  durationMs: 1000,
  progressMs: 100,
};

describe('parseNowPlaying', () => {
  it('reads a playing track', () => {
    expect(parseNowPlaying({ state: 'playing', fetchedAt: 5, track })).toEqual({
      state: 'playing',
      fetchedAt: 5,
      track,
    });
  });

  it('reads the idle state without a track', () => {
    expect(parseNowPlaying({ state: 'idle', fetchedAt: 5, track: null })).toEqual({
      state: 'idle',
      fetchedAt: 5,
      track: null,
    });
  });

  it('refuses broken bodies', () => {
    expect(parseNowPlaying(null)).toBeNull();
    expect(parseNowPlaying({ state: 'playing', fetchedAt: 5, track: null })).toBeNull();
    expect(parseNowPlaying({ state: 'dancing', fetchedAt: 5, track })).toBeNull();
    expect(
      parseNowPlaying({ state: 'playing', fetchedAt: 5, track: { ...track, durationMs: 0 } }),
    ).toBeNull();
  });
});

describe('list parsers', () => {
  const summary = {
    id: 't1',
    title: 'Song',
    artists: ['A'],
    album: 'Album',
    coverUrl: null,
    thumbUrl: null,
    url: 'https://open.spotify.com/track/t1',
    durationMs: 1000,
  };

  it('reads recently played items and drops broken ones', () => {
    const result = parseRecent({
      fetchedAt: 1,
      items: [{ track: summary, playedAt: 5 }, { track: null, playedAt: 6 }, 'nope'],
    });
    expect(result?.items).toEqual([{ track: summary, playedAt: 5 }]);
  });

  it('reads top tracks, top artists, the queue, the profile and playlists', () => {
    expect(parseTopTracks({ fetchedAt: 1, items: [summary] })?.items).toHaveLength(1);
    expect(
      parseTopArtists({
        fetchedAt: 1,
        items: [
          {
            id: 'a',
            name: 'Artist',
            url: 'https://x',
            imageUrl: null,
            genres: ['g'],
            followers: 2,
          },
        ],
      })?.items[0],
    ).toMatchObject({ name: 'Artist', followers: 2 });
    expect(parseQueue({ fetchedAt: 1, current: summary, next: [summary] })).toMatchObject({
      current: { id: 't1' },
    });
    expect(
      parseProfile({
        fetchedAt: 1,
        id: 'u',
        name: 'Me',
        url: 'https://x',
        imageUrl: null,
        followers: 3,
      }),
    ).toMatchObject({ name: 'Me', followers: 3 });
    expect(
      parsePlaylists({
        fetchedAt: 1,
        items: [{ id: 'p', name: 'List', url: 'https://x', tracks: 4 }],
      })?.items,
    ).toHaveLength(1);
  });

  it('refuses bodies without a timestamp or a list', () => {
    expect(parseRecent({ items: [] })).toBeNull();
    expect(parseTopTracks({ fetchedAt: 1 })).toBeNull();
    expect(parseProfile({ fetchedAt: 1, id: 'u' })).toBeNull();
    expect(parseQueue(null)).toBeNull();
  });
});

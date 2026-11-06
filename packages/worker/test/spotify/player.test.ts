import { describe, expect, it } from 'vitest';
import { nowPlayingOf } from '#worker/spotify/player.ts';

const track = {
  id: 't1',
  name: 'Song',
  duration_ms: 200_000,
  artists: [{ name: 'A' }, { name: 'B' }],
  album: { name: 'Album', images: [{ url: 'https://img/large' }, { url: 'https://img/small' }] },
  external_urls: { spotify: 'https://open.spotify.com/track/t1' },
};

describe('nowPlayingOf', () => {
  it('maps a playing track', () => {
    expect(nowPlayingOf({ is_playing: true, progress_ms: 5000, item: track }, 10)).toEqual({
      state: 'playing',
      fetchedAt: 10,
      track: {
        id: 't1',
        title: 'Song',
        artists: ['A', 'B'],
        album: 'Album',
        coverUrl: 'https://img/large',
        thumbUrl: 'https://img/small',
        url: 'https://open.spotify.com/track/t1',
        durationMs: 200_000,
        progressMs: 5000,
      },
    });
  });

  it('marks a paused track', () => {
    expect(nowPlayingOf({ is_playing: false, progress_ms: 0, item: track }, 1).state).toBe(
      'paused',
    );
  });

  it('maps a podcast episode to its show', () => {
    const episode = {
      id: 'e1',
      name: 'Episode',
      duration_ms: 1000,
      images: [{ url: 'https://img/episode' }],
      show: { name: 'The Show', publisher: 'Publisher' },
    };
    const result = nowPlayingOf({ is_playing: true, progress_ms: 1, item: episode }, 1);
    expect(result.track).toMatchObject({
      artists: ['The Show'],
      album: 'Publisher',
      coverUrl: 'https://img/episode',
      thumbUrl: 'https://img/episode',
      url: 'https://open.spotify.com/track/e1',
    });
  });

  it('is idle without an item, as during an advert', () => {
    expect(nowPlayingOf({ is_playing: true, item: null }, 3)).toEqual({
      state: 'idle',
      track: null,
      fetchedAt: 3,
    });
    expect(nowPlayingOf(null, 3).state).toBe('idle');
  });
});

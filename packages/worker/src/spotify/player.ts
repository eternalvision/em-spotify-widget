import { isRecord, numberOf } from '@em-spotify/shared/guards';
import type { NowPlaying, Track } from '@em-spotify/shared/types';
import { spotifyGet } from '#worker/spotify/client.ts';
import { summaryOf } from '#worker/spotify/items.ts';

const path = '/me/player/currently-playing?additional_types=track,episode';

const idleOf = (now: number): NowPlaying => ({ state: 'idle', track: null, fetchedAt: now });

const trackOf = (item: unknown, progressMs: number): Track | null => {
  const summary = summaryOf(item);
  return summary ? { ...summary, progressMs } : null;
};

export const nowPlayingOf = (body: unknown, now: number): NowPlaying => {
  if (!isRecord(body)) {
    return idleOf(now);
  }
  const track = trackOf(body.item, numberOf(body.progress_ms) ?? 0);
  if (!track) {
    return idleOf(now);
  }
  return { state: body.is_playing === true ? 'playing' : 'paused', track, fetchedAt: now };
};

export const fetchNowPlaying = async (env: Env, now: number): Promise<NowPlaying> =>
  nowPlayingOf(await spotifyGet(env, path, now), now);

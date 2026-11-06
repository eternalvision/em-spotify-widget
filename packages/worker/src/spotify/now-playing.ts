import { parseNowPlaying } from '@em-spotify/shared/parse';
import type { NowPlaying } from '@em-spotify/shared/types';
import { cachedJson } from '#worker/cache.ts';
import { isMock } from '#worker/env.ts';
import { mockNowPlaying } from '#worker/spotify/mock.ts';
import { fetchNowPlaying } from '#worker/spotify/player.ts';

const advance = (value: NowPlaying, now: number): NowPlaying => {
  if (value.state !== 'playing' || !value.track) {
    return { ...value, fetchedAt: now };
  }
  const progressMs = Math.min(
    value.track.durationMs,
    value.track.progressMs + (now - value.fetchedAt),
  );
  return { ...value, fetchedAt: now, track: { ...value.track, progressMs } };
};

export const loadNowPlaying = async (env: Env, ctx: ExecutionContext): Promise<NowPlaying> => {
  const now = Date.now();
  if (isMock(env)) {
    return mockNowPlaying(now);
  }
  const { value, hit } = await cachedJson(ctx, 'now-playing', 4, parseNowPlaying, () =>
    fetchNowPlaying(env, now),
  );
  return hit ? advance(value, now) : value;
};

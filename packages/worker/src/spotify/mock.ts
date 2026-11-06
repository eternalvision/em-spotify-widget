import type { NowPlaying } from '@em-spotify/shared/types';
import { mockTrack } from '#worker/spotify/mock-data.ts';

const durationMs = 215_000;

export const mockNowPlaying = (now: number): NowPlaying => ({
  state: 'playing',
  fetchedAt: now,
  track: { ...mockTrack(0), durationMs, progressMs: now % durationMs },
});

import type { CardOptions } from '@em-spotify/shared/options';
import { parseNowPlaying } from '@em-spotify/shared/parse';
import type { PlaybackState } from '@em-spotify/shared/types';
import { computed, effect, type ReadonlySignal, type Signal } from 'ecmact';
import { coverAccent } from '#widget/lib/cover-color.ts';
import { createPlayer } from '#widget/lib/player.ts';
import { startPolling } from '#widget/lib/poller.ts';
import { endpointOf, type Props } from '#widget/lib/props.ts';

export const createNowPlaying = (
  props: Props,
  options: ReadonlySignal<CardOptions>,
  ready: Signal<boolean>,
) => {
  const player = createPlayer();
  const snapshot = player.select((state) => state.snapshot);
  const state = computed<PlaybackState>(() => snapshot.value?.data.state ?? 'idle');
  const track = computed(() => snapshot.value?.data.track ?? null);
  const start = (): (() => void) =>
    startPolling({
      endpoint: () => endpointOf(props.api.peek(), '/api/now-playing'),
      interval: () => options.peek().refresh,
      parse: parseNowPlaying,
      onData: (data) => {
        player.getState().receive({ data, receivedAt: performance.now() });
        ready.value = true;
      },
      onError: () => {
        ready.value = true;
      },
    });
  return { snapshot, state, track, start };
};

export const followCoverAccent = (
  accent: Signal<string | null>,
  options: ReadonlySignal<CardOptions>,
  coverUrl: ReadonlySignal<string | null | undefined>,
): (() => void) =>
  effect(() => {
    const url = coverUrl.value;
    if (!options.value.coverColors || !url) {
      accent.value = null;
      return;
    }
    let current = true;
    void coverAccent(url).then((color) => {
      if (current) {
        accent.value = color;
      }
    });
    return () => {
      current = false;
    };
  });

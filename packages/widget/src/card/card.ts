import { barTimings, equalizerBars } from '@em-spotify/shared/equalizer';
import type { HideablePart } from '@em-spotify/shared/options';
import { parseNowPlaying } from '@em-spotify/shared/parse';
import { texts } from '@em-spotify/shared/texts';
import { formatTime } from '@em-spotify/shared/time';
import type { PlaybackState, Track } from '@em-spotify/shared/types';
import { computed, effect, type ReadonlySignal, signal, ThemeProvider } from 'ecmact';
import { logoMarkup } from '#widget/card/logo.ts';
import {
  Backdrop,
  Bar,
  Body,
  Card,
  Cover,
  CoverImage,
  Dot,
  Fill,
  LabelText,
  Line,
  Logo,
  Status,
  Times,
  TimeText,
  Track as TrackBar,
  Wave,
} from '#widget/card/parts.ts';
import { followCoverAccent } from '#widget/lib/now-playing.ts';
import { createCommon } from '#widget/lib/common.ts';
import { createPlayer, type Snapshot } from '#widget/lib/player.ts';
import { startPolling } from '#widget/lib/poller.ts';
import { endpointOf, type Props } from '#widget/lib/props.ts';

const unplayedOpacity = '0.28';

const positionOf = (snapshot: Snapshot, track: Track): number => {
  const elapsed = snapshot.data.state === 'playing' ? performance.now() - snapshot.receivedAt : 0;
  return Math.min(track.durationMs, track.progressMs + elapsed);
};

export const buildCard = (host: HTMLElement, props: Props): Node => {
  const player = createPlayer();
  const snapshot = player.select((state) => state.snapshot);
  const common = createCommon(host, props);
  const { options, theme } = common;
  const state = computed<PlaybackState>(() => snapshot.value?.data.state ?? 'idle');
  const idle = computed(() => state.value === 'idle');
  const track = computed(() => snapshot.value?.data.track ?? null);
  const horizontal = computed(() => options.value.layout === 'horizontal');
  const bleed = computed(
    () => options.value.coverBleed && !options.value.hide.includes('cover') && track.value !== null,
  );
  const href = computed(() => (options.value.link ? (track.value?.url ?? '') : ''));
  const elapsed = signal('0:00');
  const total = computed(() => formatTime(track.value?.durationMs ?? 0));
  const label = computed(() => {
    const dictionary = texts[options.value.lang];
    return state.value === 'idle' ? dictionary.idle : dictionary[state.value];
  });

  const hides = (part: HideablePart): ReadonlySignal<boolean> =>
    computed(() => options.value.hide.includes(part));
  const hiddenWhenIdle = (part: HideablePart): ReadonlySignal<boolean> =>
    computed(() => idle.value || options.value.hide.includes(part));
  const labelTextHidden = computed(() => !idle.value && options.value.hide.includes('label'));
  const statusHidden = computed(() => labelTextHidden.value && options.value.hide.includes('logo'));

  const bars: HTMLElement[] = [];
  const lit: string[] = [];
  let fill: HTMLElement | undefined;

  const paintBars = (position: number, track: Track): void => {
    const fraction = position / track.durationMs;
    const showProgress = !options.peek().hide.includes('wave-progress');
    const colors = common.palette.peek();
    bars.forEach((bar, index) => {
      const played = showProgress && (index + 0.5) / equalizerBars <= fraction;
      const style = !showProgress
        ? `1|var(--widget-bars, ${colors.bars})`
        : played
          ? `1|var(--widget-progress, ${colors.progress})`
          : `${unplayedOpacity}|var(--widget-bars, ${colors.bars})`;
      if (lit[index] !== style) {
        lit[index] = style;
        const [opacity = '1', background = ''] = style.split('|');
        bar.style.opacity = opacity;
        bar.style.background = background;
      }
    });
  };

  const paint = (): void => {
    const current = snapshot.peek();
    const playing = current?.data.track;
    if (!current || !playing) {
      return;
    }
    const position = positionOf(current, playing);
    elapsed.value = formatTime(position);
    if (fill) {
      fill.style.width = `${(position / playing.durationMs) * 100}%`;
    }
    paintBars(position, playing);
  };

  const card = Card({
    'data-part': 'card',
    'data-state': state,
    'data-layout': computed(() => options.value.layout),
    'data-blur': computed(() => String(options.value.coverBlur)),
    'data-bleed': computed(() => String(bleed.value)),
    $horizontal: horizontal,
    $bleed: bleed,
    $linked: computed(() => href.value !== ''),
    href,
    target: '_blank',
    rel: 'noopener noreferrer',
    onclick: (event) => {
      if (!href.peek()) {
        event.preventDefault();
      }
    },
    mounted: () => {
      const stopPolling = startPolling({
        endpoint: () => endpointOf(props.api.peek(), '/api/now-playing'),
        interval: () => options.peek().refresh,
        parse: parseNowPlaying,
        onData: (data) => {
          player.getState().receive({ data, receivedAt: performance.now() });
          common.ready.value = true;
          paint();
        },
        onError: () => {
          common.ready.value = true;
        },
      });
      const stopHost = common.watchHost();
      const stopTimings = effect(() => {
        const timings = barTimings(track.value?.id ?? '', equalizerBars);
        bars.forEach((bar, index) => {
          const timing = timings.at(index);
          if (timing) {
            bar.style.setProperty('--d', `${timing.duration}s`);
            bar.style.setProperty('--delay', `${timing.delay}s`);
            bar.style.setProperty('--lo', String(timing.low));
            bar.style.setProperty('--hi', String(timing.high));
          }
        });
      });
      const stopCover = followCoverAccent(
        common.accent,
        options,
        computed(() => track.value?.coverUrl),
      );
      let frame = requestAnimationFrame(function loop() {
        paint();
        frame = requestAnimationFrame(loop);
      });
      return () => {
        stopPolling();
        stopHost();
        stopTimings();
        stopCover();
        cancelAnimationFrame(frame);
      };
    },
    children: [
      Backdrop({
        'data-part': 'backdrop',
        $image: computed(() => (options.value.coverBlur ? (track.value?.coverUrl ?? '') : '')),
      }),
      Cover({
        'data-part': 'cover',
        $hidden: hiddenWhenIdle('cover'),
        $horizontal: horizontal,
        $bleed: bleed,
        children: [CoverImage({ alt: '', src: computed(() => track.value?.coverUrl ?? '') })],
      }),
      Body({
        $bleed: bleed,
        $horizontal: horizontal,
        children: [
          Status({
            'data-part': 'label',
            $hidden: statusHidden,
            $idle: idle,
            children: [
              Dot({ 'data-part': 'dot', $state: state }),
              LabelText({ 'data-part': 'label-text', $hidden: labelTextHidden, content: label }),
              Logo({ 'data-part': 'logo', $hidden: hides('logo'), html: logoMarkup }),
            ],
          }),
          Line({
            'data-part': 'title',
            $hidden: hiddenWhenIdle('title'),
            $size: computed(() => (horizontal.value ? 20 : 24)),
            $strong: true,
            content: computed(() => track.value?.title ?? ''),
          }),
          Line({
            'data-part': 'artist',
            $hidden: hiddenWhenIdle('artist'),
            $size: computed(() => (horizontal.value ? 14 : 15)),
            $tone: 'muted',
            content: computed(() => track.value?.artists.join(', ') ?? ''),
          }),
          Line({
            'data-part': 'album',
            $hidden: hiddenWhenIdle('album'),
            $size: 13,
            $tone: 'dim',
            content: computed(() => track.value?.album ?? ''),
          }),
          Wave({
            'data-part': 'equalizer',
            $hidden: hiddenWhenIdle('equalizer'),
            children: Array.from({ length: equalizerBars }, () =>
              Bar({
                'data-part': 'bar',
                $live: computed(() => state.value === 'playing'),
                ref: (element) => {
                  bars.push(element);
                },
              }),
            ),
          }),
          Times({
            'data-part': 'progress',
            $hidden: hiddenWhenIdle('progress'),
            children: [
              TimeText({ 'data-part': 'elapsed', content: elapsed }),
              TrackBar({
                'data-part': 'track',
                children: [
                  Fill({
                    'data-part': 'fill',
                    ref: (element) => {
                      fill = element;
                    },
                  }),
                ],
              }),
              TimeText({ 'data-part': 'total', $end: true, content: total }),
            ],
          }),
        ],
      }),
    ],
  });

  return ThemeProvider({ theme, children: [card] });
};

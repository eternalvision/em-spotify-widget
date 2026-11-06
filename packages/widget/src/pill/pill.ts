import { texts } from '@em-spotify/shared/texts';
import { barTimings } from '@em-spotify/shared/equalizer';
import { computed, css, effect, keyframes, styled, ThemeProvider } from 'ecmact';
import { logoMarkup } from '#widget/card/logo.ts';
import { Line, Logo } from '#widget/card/parts.ts';
import { createCommon } from '#widget/lib/common.ts';
import { createNowPlaying, followCoverAccent } from '#widget/lib/now-playing.ts';
import type { Props } from '#widget/lib/props.ts';

interface Themed {
  theme: Record<string, unknown>;
}

const themed =
  (key: string) =>
  (props: Themed): string =>
    String(props.theme[key]);

const shown =
  (display: string) =>
  (props: { $hidden?: boolean }): string =>
    props.$hidden ? 'none' : display;

const equalize = keyframes`
  from { transform: scaleY(var(--lo, 0.3)); }
  to { transform: scaleY(var(--hi, 0.9)); }
`;

const swaying = css`
  animation: ${equalize} var(--d, 1s) ease-in-out var(--delay, 0s) infinite alternate;
`;

const meterBars = 9;

const Capsule = styled.a<{ $linked?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
  min-height: 56px;
  padding: 8px 16px 8px 8px;
  border-radius: var(--widget-radius, ${themed('radius')}px);
  background: var(--widget-bg, ${themed('background')});
  box-shadow: inset 0 0 0 1px ${themed('hairline')};
  color: var(--widget-text, ${themed('text')});
  font-family: var(--widget-font, ${themed('font')});
  text-decoration: none;
  cursor: ${(props) => (props.$linked ? 'pointer' : 'default')};

  &:focus-visible {
    outline: 2px solid var(--widget-accent, ${themed('accent')});
    outline-offset: 2px;
  }
`;

const Disc = styled.div<{ $hidden?: boolean }>`
  display: ${shown('block')};
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px ${themed('hairline')};
  background: ${themed('track')};
  overflow: hidden;
`;

const DiscImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Words = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

const Meter = styled.div<{ $hidden?: boolean }>`
  display: ${shown('flex')};
  align-items: flex-end;
  gap: 2px;
  flex: none;
  height: 22px;
`;

const MeterBar = styled.span<{ $playing?: boolean }>`
  width: 3px;
  height: 100%;
  border-radius: 99px;
  background: var(--widget-bars, ${themed('bars')});
  transform: scaleY(var(--lo, 0.3));
  transform-origin: bottom;
  ${(props) => props.$playing && swaying}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const pillRadius = (explicit: boolean, radius: number): number => (explicit ? radius : 999);

export const buildPill = (host: HTMLElement, props: Props): Node => {
  const common = createCommon(host, props, {
    radius: (explicit, radius) => (explicit ? radius : 999),
  });
  const { options, theme } = common;
  const playback = createNowPlaying(props, options, common.ready);
  const idle = computed(() => playback.state.value === 'idle');
  const hidden = (part: 'cover' | 'title' | 'artist' | 'equalizer' | 'logo') =>
    computed(() => options.value.hide.includes(part));
  const href = computed(() => (options.value.link ? (playback.track.value?.url ?? '') : ''));
  const playing = computed(() => playback.state.value === 'playing');
  const meter: HTMLElement[] = [];

  const capsule = Capsule({
    'data-part': 'card',
    'data-state': playback.state,
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
      const stopPolling = playback.start();
      const stopHost = common.watchHost();
      const stopTimings = effect(() => {
        const timings = barTimings(playback.track.value?.id ?? '', meterBars);
        meter.forEach((bar, index) => {
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
        computed(() => playback.track.value?.coverUrl),
      );
      return () => {
        stopPolling();
        stopHost();
        stopTimings();
        stopCover();
      };
    },
    children: [
      Disc({
        'data-part': 'cover',
        $hidden: computed(() => idle.value || options.value.hide.includes('cover')),
        children: [
          DiscImage({ alt: '', src: computed(() => playback.track.value?.coverUrl ?? '') }),
        ],
      }),
      Words({
        children: [
          Line({
            'data-part': 'title',
            $size: 14,
            $strong: true,
            $hidden: hidden('title'),
            content: computed(() =>
              idle.value ? texts[options.value.lang].idle : (playback.track.value?.title ?? ''),
            ),
          }),
          Line({
            'data-part': 'artist',
            $size: 12,
            $tone: 'muted',
            $hidden: computed(() => idle.value || options.value.hide.includes('artist')),
            content: computed(() => playback.track.value?.artists.join(', ') ?? ''),
          }),
        ],
      }),
      Meter({
        'data-part': 'equalizer',
        $hidden: computed(() => idle.value || options.value.hide.includes('equalizer')),
        children: Array.from({ length: meterBars }, () =>
          MeterBar({
            $playing: playing,
            ref: (element) => {
              meter.push(element);
            },
          }),
        ),
      }),
      Logo({ 'data-part': 'logo', $hidden: hidden('logo'), html: logoMarkup }),
    ],
  });

  return ThemeProvider({ theme, children: [capsule] });
};

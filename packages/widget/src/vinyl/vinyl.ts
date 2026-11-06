import { texts } from '@em-spotify/shared/texts';
import { computed, css, keyframes, styled, ThemeProvider } from 'ecmact';
import { logoMarkup } from '#widget/card/logo.ts';
import { Dot, LabelText, Line, Logo, Status } from '#widget/card/parts.ts';
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

const spin = keyframes`
  from { rotate: 0deg; }
  to { rotate: 360deg; }
`;

const spinning = css`
  animation: ${spin} 9s linear infinite;
`;

const Sleeve = styled.a<{ $linked?: boolean }>`
  display: grid;
  gap: ${themed('gap')}px;
  box-sizing: border-box;
  width: 100%;
  padding: ${themed('padding')}px;
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

const Record = styled.div<{ $state?: string; $hidden?: boolean }>`
  position: relative;
  display: ${shown('block')};
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    conic-gradient(
      from 30deg,
      transparent 0deg,
      rgba(255, 255, 255, 0.09) 40deg,
      transparent 90deg,
      transparent 180deg,
      rgba(255, 255, 255, 0.09) 220deg,
      transparent 270deg
    ),
    repeating-radial-gradient(circle at center, #0b0b0b 0 2px, #171717 2px 3px);
  box-shadow:
    0 0 0 1px ${themed('hairline')},
    0 24px 40px -22px color-mix(in srgb, var(--widget-accent, ${themed('accent')}) 55%, transparent);
  ${(props) => props.$state !== 'idle' && spinning}
  animation-play-state: ${(props) => (props.$state === 'paused' ? 'paused' : 'running')};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Label = styled.div<{ $hidden?: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  display: ${shown('block')};
  width: 36%;
  aspect-ratio: 1;
  margin: -18% 0 0 -18%;
  border-radius: 50%;
  background: ${themed('track')};
  box-shadow: 0 0 0 3px #0b0b0b;
  overflow: hidden;
`;

const LabelImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Spindle = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5%;
  aspect-ratio: 1;
  margin: -2.5% 0 0 -2.5%;
  border-radius: 50%;
  background: var(--widget-bg, ${themed('background')});
  box-shadow: 0 0 0 2px #0b0b0b;
`;

const Words = styled.div`
  display: grid;
  gap: 4px;
`;

export const buildVinyl = (host: HTMLElement, props: Props): Node => {
  const common = createCommon(host, props);
  const { options, theme } = common;
  const playback = createNowPlaying(props, options, common.ready);
  const idle = computed(() => playback.state.value === 'idle');
  const hidden = (part: 'cover' | 'title' | 'artist' | 'logo') =>
    computed(() => options.value.hide.includes(part));
  const href = computed(() => (options.value.link ? (playback.track.value?.url ?? '') : ''));
  const labelTextHidden = computed(() => !idle.value && options.value.hide.includes('label'));
  const label = computed(() => {
    const dictionary = texts[options.value.lang];
    return idle.value ? dictionary.idle : dictionary[playback.state.value];
  });

  const sleeve = Sleeve({
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
      const stopCover = followCoverAccent(
        common.accent,
        options,
        computed(() => playback.track.value?.coverUrl),
      );
      return () => {
        stopPolling();
        stopHost();
        stopCover();
      };
    },
    children: [
      Record({
        'data-part': 'record',
        $state: playback.state,
        $hidden: idle,
        children: [
          Label({
            'data-part': 'cover',
            $hidden: hidden('cover'),
            children: [
              LabelImage({ alt: '', src: computed(() => playback.track.value?.coverUrl ?? '') }),
            ],
          }),
          Spindle(),
        ],
      }),
      Words({
        children: [
          Status({
            'data-part': 'label',
            $idle: idle,
            children: [
              Dot({ $state: playback.state }),
              LabelText({ 'data-part': 'label-text', $hidden: labelTextHidden, content: label }),
              Logo({ 'data-part': 'logo', $hidden: hidden('logo'), html: logoMarkup }),
            ],
          }),
          Line({
            'data-part': 'title',
            $size: 22,
            $strong: true,
            $hidden: computed(() => idle.value || options.value.hide.includes('title')),
            content: computed(() => playback.track.value?.title ?? ''),
          }),
          Line({
            'data-part': 'artist',
            $size: 15,
            $tone: 'muted',
            $hidden: computed(() => idle.value || options.value.hide.includes('artist')),
            content: computed(() => playback.track.value?.artists.join(', ') ?? ''),
          }),
        ],
      }),
    ],
  });

  return ThemeProvider({ theme, children: [sleeve] });
};

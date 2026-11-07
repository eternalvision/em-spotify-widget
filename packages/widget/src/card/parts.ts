import { css, keyframes, styled } from 'ecmact';

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

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.65); }
`;

const pulsing = css`
  animation: ${pulse} 1.8s ease-in-out infinite;
`;

export const Card = styled.a<{
  $horizontal?: boolean;
  $linked?: boolean;
  $bleed?: boolean;
  $square?: boolean;
}>`
  position: relative;
  display: flex;
  flex-direction: ${(props) => (props.$horizontal ? 'row' : 'column')};
  align-items: stretch;
  justify-content: ${(props) => (props.$square ? 'flex-end' : 'flex-start')};
  ${(props) => (props.$square ? 'aspect-ratio: 1;' : '')}
  gap: ${(props) => (props.$bleed || props.$square ? '0' : `${themed('gap')(props)}px`)};
  box-sizing: border-box;
  width: 100%;
  padding: ${(props) => (props.$bleed ? '0' : `${themed('padding')(props)}px`)};
  border-radius: var(--widget-radius, ${themed('radius')}px);
  background: var(--widget-bg, ${themed('background')});
  box-shadow: inset 0 0 0 1px ${themed('hairline')};
  color: var(--widget-text, ${themed('text')});
  font-family: var(--widget-font, ${themed('font')});
  text-decoration: none;
  overflow: hidden;
  isolation: isolate;
  cursor: ${(props) => (props.$linked ? 'pointer' : 'default')};

  &:focus-visible {
    outline: 2px solid var(--widget-accent, ${themed('accent')});
    outline-offset: 2px;
  }
`;

export const Backdrop = styled.div<{ $image?: string }>`
  position: absolute;
  inset: 0;
  z-index: -1;
  display: ${(props) => (props.$image ? 'block' : 'none')};
  background-image: ${(props) =>
    props.$image ? `url("${props.$image.replace(/["\\]/g, '')}")` : 'none'};
  background-position: center;
  background-size: cover;
  filter: blur(22px);
  opacity: 0.6;
  transform: scale(1.5);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--widget-bg, ${themed('background')});
    opacity: 0.45;
  }
`;

const scrim = (props: Themed): string => {
  const background = `var(--widget-bg, ${themed('background')(props)})`;
  return `linear-gradient(to bottom, color-mix(in srgb, ${background} 55%, transparent) 0%, transparent 22%, transparent 25%, color-mix(in srgb, ${background} 78%, transparent) 68%, color-mix(in srgb, ${background} 95%, transparent) 100%)`;
};

export const Cover = styled.div<{
  $hidden?: boolean;
  $horizontal?: boolean;
  $bleed?: boolean;
  $square?: boolean;
}>`
  position: ${(props) => (props.$square ? 'absolute' : 'relative')};
  ${(props) => (props.$square ? 'inset: 0; z-index: -1;' : '')}
  display: ${shown('block')};
  flex: none;
  width: ${(props) => (props.$horizontal ? 'clamp(72px, 30%, 240px)' : '100%')};
  ${(props) => (!props.$square && !(props.$horizontal && props.$bleed) ? 'aspect-ratio: 1;' : '')}
  border-radius: ${(props) =>
    props.$bleed || props.$square
      ? '0'
      : `calc(var(--widget-radius, ${themed('radius')(props)}px) * 0.78)`};
  box-shadow: ${(props) =>
    props.$bleed || props.$square
      ? 'none'
      : `0 18px 36px -20px color-mix(in srgb, var(--widget-accent, ${themed('accent')(props)}) 45%, transparent)`};
  overflow: hidden;
  background: ${themed('track')};
`;

export const Scrim = styled.div<{ $hidden?: boolean }>`
  position: absolute;
  inset: 0;
  z-index: -1;
  display: ${shown('block')};
  background: ${scrim};
  pointer-events: none;
`;

export const CoverImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const Body = styled.div<{ $bleed?: boolean; $horizontal?: boolean; $square?: boolean }>`
  position: ${(props) => (props.$square ? 'static' : 'relative')};
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  justify-content: ${(props) => (props.$square ? 'flex-end' : 'flex-start')};
  padding: ${(props) => {
    const padding = `${themed('padding')(props)}px`;
    const gap = `${themed('gap')(props)}px`;
    if (!props.$bleed) {
      return '0';
    }
    return props.$horizontal
      ? `${padding} ${padding} ${padding} ${gap}`
      : `${gap} ${padding} ${padding}`;
  }};
`;

export const Status = styled.div<{ $hidden?: boolean; $idle?: boolean; $square?: boolean }>`
  display: ${shown('flex')};
  ${(props) =>
    props.$square
      ? `position: absolute; top: ${themed('padding')(props)}px; left: ${themed('padding')(props)}px; right: ${themed('padding')(props)}px; margin: 0;`
      : ''}
  align-items: center;
  gap: 8px;
  min-height: 20px;
  ${(props) => (props.$square ? '' : 'margin-bottom: 4px;')}
  font-size: ${(props) => (props.$idle ? '16px' : '13px')};
  font-weight: 600;
  color: ${themed('muted')};
`;

export const Dot = styled.span<{ $state?: string }>`
  display: ${(props) => (props.$state === 'idle' ? 'none' : 'block')};
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) =>
    props.$state === 'paused' ? 'transparent' : `var(--widget-accent, ${themed('accent')(props)})`};
  box-shadow: ${(props) =>
    props.$state === 'paused' ? `inset 0 0 0 2px ${themed('dim')(props)}` : 'none'};
  ${(props) => props.$state === 'playing' && pulsing}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const LabelText = styled.span<{ $hidden?: boolean }>`
  display: ${shown('block')};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const Logo = styled.span<{ $hidden?: boolean }>`
  display: ${shown('flex')};
  flex: none;
  margin-left: auto;

  svg {
    width: 18px;
    height: 18px;
    fill: ${themed('dim')};
  }
`;

export const Line = styled.div<{
  $hidden?: boolean;
  $size?: number;
  $strong?: boolean;
  $tone?: 'text' | 'muted' | 'dim';
}>`
  display: ${shown('block')};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: ${(props) => String(props.$size ?? 14)}px;
  font-weight: ${(props) => (props.$strong ? '750' : '450')};
  line-height: ${(props) => (props.$strong ? '1.15' : '1.3')};
  letter-spacing: ${(props) => (props.$strong ? '-0.02em' : '0')};
  color: ${(props) => (props.$tone && props.$tone !== 'text' ? themed(props.$tone)(props) : 'inherit')};
`;

export const Wave = styled.div<{ $hidden?: boolean }>`
  display: ${shown('flex')};
  align-items: center;
  gap: 2px;
  height: 40px;
  margin-top: 10px;
`;

const equalize = keyframes`
  from { transform: scaleY(var(--lo, 0.3)); }
  to { transform: scaleY(var(--hi, 0.8)); }
`;

const swaying = css`
  animation: ${equalize} var(--d, 1s) ease-in-out var(--delay, 0s) infinite alternate;
`;

export const Bar = styled.div<{ $live?: boolean }>`
  flex: 1;
  min-width: 0;
  height: 100%;
  border-radius: 99px;
  background: var(--widget-bars, ${themed('bars')});
  opacity: 0.28;
  transform: scaleY(var(--lo, 0.3));
  ${(props) => props.$live && swaying}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Times = styled.div<{ $hidden?: boolean }>`
  display: ${shown('flex')};
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: ${themed('dim')};
`;

export const TimeText = styled.span<{ $end?: boolean }>`
  flex: none;
  min-width: 34px;
  text-align: ${(props) => (props.$end ? 'right' : 'left')};
`;

export const Track = styled.div`
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: ${themed('track')};
  overflow: hidden;
`;

export const Fill = styled.div`
  width: 0;
  height: 100%;
  border-radius: 2px;
  background: var(--widget-progress, ${themed('progress')});
`;

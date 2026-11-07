import { barTimings, equalizerBars } from '@em-spotify/shared/equalizer';
import { spotifyLogoPath } from '@em-spotify/shared/logo';
import type { CardOptions, HideablePart } from '@em-spotify/shared/options';
import { type Palette, resolvePalette } from '@em-spotify/shared/palette';
import { texts } from '@em-spotify/shared/texts';
import { formatTime } from '@em-spotify/shared/time';
import type { NowPlaying, Track } from '@em-spotify/shared/types';
import { escapeXml, fitText } from '#worker/card/xml.ts';

const gap = 2;
const waveHeight = 40;
const timeSlot = 34;
const digitWidth = 7;
const colonWidth = 3.5;
const timeLine = 15;
const unplayedOpacity = 0.28;
const systemFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

interface Block {
  markup: string;
  height: number;
}

interface Frame {
  options: CardOptions;
  palette: Palette;
  track: Track;
  state: NowPlaying['state'];
  cover: string | null;
  left: number;
  width: number;
}

type Builder = (y: number) => Block | null;

const shows = (options: CardOptions, part: HideablePart): boolean => !options.hide.includes(part);

const logo = (palette: Palette, x: number, y: number): string =>
  `<g transform="translate(${x} ${y}) scale(0.75)"><path d="${spotifyLogoPath}" fill="${palette.dim}"/></g>`;

const statusBlock = (frame: Frame, y: number): Block | null => {
  const { options, palette, left, width, state } = frame;
  const showLabel = shows(options, 'label');
  const showLogo = shows(options, 'logo');
  if (!showLabel && !showLogo) {
    return null;
  }
  const dictionary = texts[options.lang];
  const text = state === 'paused' ? dictionary.paused : dictionary.playing;
  const dot =
    state === 'paused'
      ? `<circle cx="${left + 4}" cy="${y + 10}" r="3" fill="none" stroke="${palette.dim}" stroke-width="2"/>`
      : `<circle class="dot" cx="${left + 4}" cy="${y + 10}" r="4" fill="${palette.accent}"/>`;
  const label = showLabel
    ? `${dot}<text x="${left + 18}" y="${y + 15}" font-size="13" font-weight="600" fill="${palette.muted}">${escapeXml(fitText(text, width - 48, 13, 600))}</text>`
    : '';
  const mark = showLogo ? logo(palette, left + width - 18, y + 1) : '';
  return { markup: `${label}${mark}`, height: 28 };
};

const lineBlock = (
  frame: Frame,
  y: number,
  text: string,
  size: number,
  color: string,
  weight: number,
  spacing: string,
): Block => {
  const lineHeight = size * (weight > 600 ? 1.15 : 1.3);
  const baseline = y + (lineHeight + size * 0.72) / 2 - size * 0.08;
  return {
    markup: `<text x="${frame.left}" y="${baseline.toFixed(1)}" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}" fill="${color}">${escapeXml(fitText(text, frame.width, size, weight))}</text>`,
    height: Math.round(lineHeight) + 4,
  };
};

const waveBlock = (frame: Frame, top: number, offset: number): Block => {
  const y = top + offset;
  const { options, palette, track, state, left, width } = frame;
  const barWidth = (width - gap * (equalizerBars - 1)) / equalizerBars;
  const fraction = track.progressMs / track.durationMs;
  const showProgress = shows(options, 'wave-progress');
  const bars = barTimings(track.id, equalizerBars)
    .map((timing, index) => {
      const x = left + index * (barWidth + gap);
      const reaches = (index + 0.5) / equalizerBars;
      const played = showProgress && reaches <= fraction;
      const unplayed = showProgress && !played;
      const arrival = (reaches * track.durationMs - track.progressMs) / 1000;
      const classes = [
        'bar',
        state === 'playing' ? '' : 'still',
        unplayed && state === 'playing' ? 'unlit' : '',
      ]
        .filter(Boolean)
        .join(' ');
      const motion =
        state === 'playing'
          ? `--d:${timing.duration.toFixed(2)}s;--delay:${timing.delay.toFixed(2)}s;--lo:${timing.low.toFixed(2)};--hi:${timing.high.toFixed(2)};--ld:${Math.max(0, arrival).toFixed(2)}s`
          : `transform:scaleY(${timing.low.toFixed(2)})`;
      const color = played ? palette.progress : palette.bars;
      const opacity = unplayed ? ` fill-opacity="${unplayedOpacity}"` : '';
      return `<rect class="${classes}" x="${x.toFixed(2)}" y="${y}" width="${barWidth.toFixed(2)}" height="${waveHeight}" rx="${(barWidth / 2).toFixed(2)}" fill="${color}"${opacity} style="${motion}"/>`;
    })
    .join('');
  return { markup: bars, height: offset + waveHeight + 4 };
};

const rolling = (x: number, top: number, digits: number, period: number, phase: number): string => {
  const strip = Array.from(
    { length: digits },
    (_, index) =>
      `<text x="${digitWidth / 2}" y="${index * timeLine + 12}" text-anchor="middle">${index}</text>`,
  ).join('');
  return `<svg x="${x.toFixed(2)}" y="${top}" width="${digitWidth}" height="${timeLine}" overflow="hidden"><g style="--end:${-digits * timeLine}px;animation:roll ${period}s steps(${digits}) -${phase.toFixed(2)}s infinite">${strip}</g></svg>`;
};

const ticker = (left: number, top: number, track: Track, attributes: string): string => {
  const seconds = track.progressMs / 1000;
  const long = track.durationMs >= 600_000;
  let x = left;
  let markup = '';
  if (long) {
    markup += rolling(x, top, 6, 6000, seconds % 6000);
    x += digitWidth;
  }
  markup += rolling(x, top, 10, 600, seconds % 600);
  x += digitWidth;
  markup += `<text x="${x.toFixed(2)}" y="${top + 12}">:</text>`;
  x += colonWidth;
  markup += rolling(x, top, 6, 60, seconds % 60);
  markup += rolling(x + digitWidth, top, 10, 10, seconds % 10);
  return `<g class="tk" ${attributes}>${markup}</g>`;
};

const timesBlock = (frame: Frame, top: number, offset: number): Block => {
  const y = top + offset;
  const { palette, track, state, left, width } = frame;
  const text = `font-size="12" fill="${palette.dim}" font-variant-numeric="tabular-nums"`;
  const barX = left + timeSlot + 8;
  const barWidth = Math.max(0, width - (timeSlot + 8) * 2);
  const fraction = Math.min(1, track.progressMs / track.durationMs);
  const from = barWidth * fraction;
  const remaining = Math.max(0, track.durationMs - track.progressMs) / 1000;
  const motion =
    state === 'playing'
      ? ` style="animation:grow ${remaining.toFixed(1)}s linear forwards;--from:${from.toFixed(2)}px;--to:${barWidth.toFixed(2)}px"`
      : '';
  const elapsed =
    state === 'playing'
      ? `${ticker(left, y, track, text)}<text class="ts" x="${left}" y="${y + 12}" ${text}>${formatTime(track.progressMs)}</text>`
      : `<text x="${left}" y="${y + 12}" ${text}>${formatTime(track.progressMs)}</text>`;
  return {
    markup: `${elapsed}<rect x="${barX}" y="${y + 6}" width="${barWidth.toFixed(2)}" height="4" rx="2" fill="${palette.track}"/><rect x="${barX}" y="${y + 6}" width="${from.toFixed(2)}" height="4" rx="2" fill="${palette.progress}"${motion}/><text x="${left + width}" y="${y + 12}" text-anchor="end" ${text}>${formatTime(track.durationMs)}</text>`,
    height: offset + 15,
  };
};

const stack = (blocks: readonly Builder[], start: number) => {
  let y = start;
  let markup = '';
  for (const build of blocks) {
    const block = build(y);
    if (block) {
      markup += block.markup;
      y += block.height;
    }
  }
  return { markup, end: y };
};

const styleOf = (options: CardOptions, palette: Palette): string =>
  `svg{--p:${palette.progress}}text{font-family:${options.font ?? systemFont}}@keyframes eq{from{transform:scaleY(var(--lo))}to{transform:scaleY(var(--hi))}}@keyframes lit{to{fill-opacity:1;fill:var(--p)}}@keyframes grow{from{width:var(--from)}to{width:var(--to)}}@keyframes roll{to{transform:translateY(var(--end))}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}.bar{transform-box:fill-box;transform-origin:center;animation:eq var(--d) ease-in-out var(--delay) infinite alternate}.bar.unlit{animation:eq var(--d) ease-in-out var(--delay) infinite alternate,lit .01s linear var(--ld) forwards}.still{transform-box:fill-box;transform-origin:center}.ts{display:none}.dot{animation:pulse 1.8s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.bar,.dot,.bar.unlit{animation:none}.ts{display:inline}.tk{display:none}}`;

const backdrop = (frame: Frame, width: number, height: number): string => {
  const { options, palette, cover } = frame;
  if (!options.coverBlur || !cover || options.layout === 'square') {
    return '';
  }
  return `<filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter><image href="${cover}" x="${-width * 0.25}" y="${-height * 0.25}" width="${width * 1.5}" height="${height * 1.5}" preserveAspectRatio="xMidYMid slice" filter="url(#blur)" opacity="0.6"/><rect width="${width}" height="${height}" fill="${palette.background}" opacity="0.45"/>`;
};

const wrap = (frame: Frame, width: number, height: number, body: string): string => {
  const { options, palette } = frame;
  const r = options.radius;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Spotify"><style>${styleOf(options, palette)}</style><clipPath id="card"><rect width="${width}" height="${height}" rx="${r}"/></clipPath><rect width="${width}" height="${height}" rx="${r}" fill="${palette.background}"/><g clip-path="url(#card)">${backdrop(frame, width, height)}${body}</g><rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${Math.max(0, r - 0.5)}" fill="none" stroke="${palette.hairline}"/></svg>`;
};

const glowOf = (palette: Palette, x: number, y: number, width: number, height: number): string =>
  `<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="18"/></filter><rect x="${x + 20}" y="${y + 38}" width="${Math.max(0, width - 40)}" height="${Math.max(0, height - 40)}" fill="${palette.accent}" fill-opacity="0.45" filter="url(#glow)"/>`;

const coverRadius = (options: CardOptions): number => Math.round(options.radius * 0.78);

const coverMarkup = (
  cover: string,
  palette: Palette,
  box: { x: number; y: number; width: number; height: number; radius: number; glow: boolean },
): string => {
  const { x, y, width, height, radius } = box;
  const glow = box.glow ? glowOf(palette, x, y, width, height) : '';
  return `${glow}<clipPath id="c"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}"/></clipPath><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${palette.track}"/><image href="${cover}" x="${x}" y="${y}" width="${width}" height="${height}" clip-path="url(#c)" preserveAspectRatio="xMidYMid slice"/>`;
};

const textBlocks = (frame: Frame, size: { title: number; artist: number }): Builder[] => {
  const { options, palette, track } = frame;
  return [
    (y) => statusBlock(frame, y),
    (y) =>
      shows(options, 'title')
        ? lineBlock(frame, y, track.title, size.title, palette.text, 750, '-0.02em')
        : null,
    (y) =>
      shows(options, 'artist')
        ? lineBlock(frame, y, track.artists.join(', '), size.artist, palette.muted, 450, '0')
        : null,
    (y) =>
      shows(options, 'album') && track.album
        ? lineBlock(frame, y, track.album, 13, palette.dim, 450, '0')
        : null,
    (y) => (shows(options, 'equalizer') ? waveBlock(frame, y, 10) : null),
    (y) => (shows(options, 'progress') ? timesBlock(frame, y, 0) : null),
  ];
};

export const idleCard = (options: CardOptions): string => {
  const palette = resolvePalette(options, null);
  const { width, padding } = options;
  const mark = shows(options, 'logo') ? logo(palette, width - padding - 18, padding + 1) : '';
  const text = `<text x="${padding}" y="${padding + 16}" font-size="16" font-weight="600" fill="${palette.muted}">${escapeXml(fitText(texts[options.lang].idle, width - padding * 2 - 28, 16, 600))}</text>`;
  const frame = { options, palette } as Frame;
  return wrap(frame, width, padding * 2 + 24, `${text}${mark}`);
};

const verticalCard = (frame: Frame): string => {
  const { options, palette, cover } = frame;
  const showCover = shows(options, 'cover') && cover !== null;
  const bleed = showCover && options.coverBleed;
  const side = bleed ? options.width : frame.width;
  const { padding, gap } = options;
  const x = bleed ? 0 : padding;
  const content = stack(
    [
      (y) =>
        showCover
          ? {
              markup: coverMarkup(cover, palette, {
                x,
                y,
                width: side,
                height: side,
                radius: bleed ? 0 : coverRadius(options),
                glow: !bleed,
              }),
              height: side + gap,
            }
          : null,
      ...textBlocks(frame, { title: 24, artist: 15 }),
    ],
    bleed ? 0 : padding,
  );
  return wrap(frame, options.width, content.end + padding, content.markup);
};

const horizontalCard = (frame: Frame): string => {
  const { options, palette, cover } = frame;
  const showCover = shows(options, 'cover') && cover !== null;
  const bleed = showCover && options.coverBleed;
  const base = bleed ? options.width : frame.width;
  const coverWidth = Math.min(240, Math.max(72, Math.round(base * 0.3)));
  const { padding, gap } = options;
  const textLeft = showCover ? (bleed ? 0 : padding) + coverWidth + gap : padding;
  const textFrame = { ...frame, left: textLeft, width: options.width - textLeft - padding };
  const content = stack(textBlocks(textFrame, { title: 20, artist: 14 }), padding);
  const height = Math.max(
    content.end + padding,
    showCover ? coverWidth + (bleed ? 0 : padding * 2) : 0,
  );
  const image = showCover
    ? coverMarkup(cover, palette, {
        x: bleed ? 0 : padding,
        y: bleed ? 0 : padding,
        width: coverWidth,
        height: bleed ? height : coverWidth,
        radius: bleed ? 0 : coverRadius(options),
        glow: !bleed,
      })
    : '';
  return wrap(frame, options.width, height, `${image}${content.markup}`);
};

const squareScrim = (palette: Palette, width: number, height: number): string =>
  `<linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.background}" stop-opacity="0.55"/><stop offset="0.22" stop-color="${palette.background}" stop-opacity="0"/><stop offset="0.25" stop-color="${palette.background}" stop-opacity="0"/><stop offset="0.68" stop-color="${palette.background}" stop-opacity="0.78"/><stop offset="1" stop-color="${palette.background}" stop-opacity="0.95"/></linearGradient><rect width="${width}" height="${height}" fill="url(#scrim)"/>`;

const squareCard = (frame: Frame): string => {
  const { options, palette, cover } = frame;
  const { padding, width } = options;
  const lines = textBlocks(frame, { title: 24, artist: 15 }).slice(1);
  const lower = stack(lines, 0).end;
  const height = Math.max(width, lower + padding * 2);
  const content = stack(lines, height - padding - lower);
  const status = statusBlock(frame, padding);
  const showCover = shows(options, 'cover') && cover !== null;
  const image = showCover
    ? `<image href="${cover}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>${squareScrim(palette, width, height)}`
    : '';
  return wrap(frame, width, height, `${image}${status?.markup ?? ''}${content.markup}`);
};

export const playingCard = (
  options: CardOptions,
  data: NowPlaying,
  track: Track,
  cover: string | null,
  accent: string | null,
): string => {
  const frame: Frame = {
    options,
    palette: resolvePalette(options, accent),
    track,
    state: data.state,
    cover,
    left: options.padding,
    width: options.width - options.padding * 2,
  };
  switch (options.layout) {
    case 'horizontal':
      return horizontalCard(frame);
    case 'square':
      return squareCard(frame);
    case 'vertical':
      return verticalCard(frame);
  }
};

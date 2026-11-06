import type { CardOptions, ThemeName } from '#shared/options.ts';

export interface Palette {
  background: string;
  text: string;
  muted: string;
  dim: string;
  hairline: string;
  accent: string;
  bars: string;
  progress: string;
  track: string;
}

interface ThemeColors {
  background: string;
  text: string;
  accent: string;
}

const themes: Record<ThemeName, ThemeColors> = {
  dark: { background: '#121212', text: '#ffffff', accent: '#1db954' },
  light: { background: '#ffffff', text: '#121212', accent: '#1db954' },
  green: { background: '#1db954', text: '#000000', accent: '#000000' },
};

const channelsOf = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

export const mixColors = (first: string, second: string, share: number): string => {
  const a = channelsOf(first);
  const b = channelsOf(second);
  const channels = a.map((value, index) =>
    Math.round(value * share + (b[index] ?? 0) * (1 - share))
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${channels.join('')}`;
};

export const resolvePalette = (options: CardOptions, coverAccent: string | null): Palette => {
  const theme = themes[options.theme];
  const background = options.background ?? theme.background;
  const text = options.color ?? theme.text;
  const derived = options.coverColors ? coverAccent : null;
  const accent = options.accent ?? derived ?? theme.accent;
  return {
    background,
    text,
    muted: mixColors(text, background, 0.7),
    dim: mixColors(text, background, 0.45),
    hairline: mixColors(text, background, 0.1),
    accent,
    bars: options.bars ?? derived ?? accent,
    progress: options.progress ?? derived ?? accent,
    track: mixColors(text, background, 0.2),
  };
};

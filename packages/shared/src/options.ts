export const themeNames = ['dark', 'light', 'green'] as const;
export const layoutNames = ['vertical', 'horizontal', 'square'] as const;
export const languageNames = ['en', 'ru', 'uk', 'cs'] as const;
export const rangeNames = ['short', 'medium', 'long'] as const;
export const hideableParts = [
  'cover',
  'title',
  'artist',
  'album',
  'progress',
  'wave-progress',
  'equalizer',
  'logo',
  'label',
  'heading',
  'meta',
] as const;
export const attributeNames = [
  'theme',
  'layout',
  'lang',
  'background',
  'color',
  'accent',
  'bars',
  'progress',
  'font',
  'radius',
  'width',
  'padding',
  'gap',
  'hide',
  'cover-colors',
  'cover-blur',
  'cover-bleed',
  'link',
  'refresh',
  'range',
  'count',
] as const;

export type ThemeName = (typeof themeNames)[number];
export type LayoutName = (typeof layoutNames)[number];
export type LanguageName = (typeof languageNames)[number];
export type RangeName = (typeof rangeNames)[number];
export type HideablePart = (typeof hideableParts)[number];
export type AttributeName = (typeof attributeNames)[number];
export type AttributeReader = (name: AttributeName) => string | null;

export interface CardOptions {
  theme: ThemeName;
  layout: LayoutName;
  lang: LanguageName;
  background: string | null;
  color: string | null;
  accent: string | null;
  bars: string | null;
  progress: string | null;
  font: string | null;
  radius: number;
  width: number;
  padding: number;
  gap: number;
  hide: readonly HideablePart[];
  coverColors: boolean;
  coverBlur: boolean;
  coverBleed: boolean;
  link: boolean;
  refresh: number;
  range: RangeName;
  count: number;
}

export const limits = {
  radius: { min: 0, max: 48 },
  width: { min: 200, max: 640 },
  padding: { min: 0, max: 48 },
  gap: { min: 0, max: 48 },
  refresh: { min: 3, max: 300 },
  count: { min: 1, max: 20 },
} as const;

const oneOf = <T extends string>(values: readonly T[], value: string | null, fallback: T): T =>
  values.find((item) => item === value?.trim()) ?? fallback;

const hexOf = (value: string | null): string | null => {
  const clean = value?.trim().replace(/^#/, '') ?? '';
  return /^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean) ? `#${clean.toLowerCase()}` : null;
};

const numberOf = (
  value: string | null,
  range: { min: number; max: number },
  fallback: number,
): number => {
  const parsed = Number(value);
  if (value === null || value.trim() === '' || !Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(range.max, Math.max(range.min, Math.round(parsed)));
};

const flagOf = (value: string | null, fallback: boolean): boolean =>
  value === null ? fallback : !['false', '0', 'no', 'off'].includes(value.trim().toLowerCase());

const listOf = <T extends string>(values: readonly T[], value: string | null): T[] =>
  (value?.split(',') ?? [])
    .map((item) => item.trim())
    .filter((item): item is T => values.some((known) => known === item));

const fontOf = (value: string | null): string | null =>
  value !== null && /^[\w\s,'"-]{1,80}$/.test(value) && value.trim() !== '' ? value.trim() : null;

export const defaultOptions: CardOptions = {
  theme: 'dark',
  layout: 'vertical',
  lang: 'en',
  background: null,
  color: null,
  accent: null,
  bars: null,
  progress: null,
  font: null,
  radius: 18,
  width: 320,
  padding: 18,
  gap: 14,
  hide: [],
  coverColors: false,
  coverBlur: false,
  coverBleed: false,
  link: true,
  refresh: 10,
  range: 'medium',
  count: 5,
};

export const parseOptions = (read: AttributeReader): CardOptions => ({
  theme: oneOf(themeNames, read('theme'), defaultOptions.theme),
  layout: oneOf(layoutNames, read('layout'), defaultOptions.layout),
  lang: oneOf(languageNames, read('lang'), defaultOptions.lang),
  background: hexOf(read('background')),
  color: hexOf(read('color')),
  accent: hexOf(read('accent')),
  bars: hexOf(read('bars')),
  progress: hexOf(read('progress')),
  font: fontOf(read('font')),
  radius: numberOf(read('radius'), limits.radius, defaultOptions.radius),
  width: numberOf(read('width'), limits.width, defaultOptions.width),
  padding: numberOf(read('padding'), limits.padding, defaultOptions.padding),
  gap: numberOf(read('gap'), limits.gap, defaultOptions.gap),
  hide: listOf(hideableParts, read('hide')),
  coverColors: flagOf(read('cover-colors'), defaultOptions.coverColors),
  coverBlur: flagOf(read('cover-blur'), defaultOptions.coverBlur),
  coverBleed: flagOf(read('cover-bleed'), defaultOptions.coverBleed),
  link: flagOf(read('link'), defaultOptions.link),
  refresh: numberOf(read('refresh'), limits.refresh, defaultOptions.refresh),
  range: oneOf(rangeNames, read('range'), defaultOptions.range),
  count: numberOf(read('count'), limits.count, defaultOptions.count),
});

export const tokens = {
  ink: '#0b0b0b',
  panel: '#121212',
  raised: '#1a1a1a',
  line: '#262626',
  lineStrong: '#383838',
  text: '#f1f1f1',
  muted: '#a1a1a1',
  dim: '#6b6b6b',
  green: '#1db954',
  greenSoft: 'rgba(29, 185, 84, 0.16)',
} as const;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

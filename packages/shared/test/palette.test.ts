import { describe, expect, it } from 'vitest';
import { defaultOptions } from '#shared/options.ts';
import { mixColors, resolvePalette } from '#shared/palette.ts';

describe('mixColors', () => {
  it('mixes two colors by share', () => {
    expect(mixColors('#ffffff', '#000000', 0.5)).toBe('#808080');
    expect(mixColors('#fff', '#000', 1)).toBe('#ffffff');
  });
});

describe('resolvePalette', () => {
  it('takes the theme colors by default', () => {
    expect(resolvePalette(defaultOptions, null)).toMatchObject({
      background: '#121212',
      accent: '#1db954',
      bars: '#1db954',
    });
  });

  it('puts explicit colors over the cover color over the theme', () => {
    const withCover = { ...defaultOptions, coverColors: true };
    expect(resolvePalette(withCover, '#ff8800').accent).toBe('#ff8800');
    expect(resolvePalette({ ...withCover, accent: '#0000ff' }, '#ff8800').accent).toBe('#0000ff');
    expect(resolvePalette({ ...withCover, bars: '#00ff00' }, '#ff8800').bars).toBe('#00ff00');
    expect(resolvePalette(defaultOptions, '#ff8800').accent).toBe('#1db954');
  });
});

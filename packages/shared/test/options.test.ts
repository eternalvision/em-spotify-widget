import { describe, expect, it } from 'vitest';
import { type AttributeName, defaultOptions, parseOptions } from '#shared/options.ts';

const read =
  (values: Partial<Record<AttributeName, string>>) =>
  (name: AttributeName): string | null =>
    values[name] ?? null;

describe('parseOptions', () => {
  it('returns the defaults without attributes', () => {
    expect(parseOptions(read({}))).toEqual(defaultOptions);
  });

  it('reads valid values', () => {
    const options = parseOptions(
      read({
        theme: 'light',
        layout: 'horizontal',
        lang: 'ru',
        accent: '#FF0000',
        radius: '8',
        width: '400',
        hide: 'cover, album,nope',
        'cover-colors': '',
        link: 'false',
        refresh: '30',
      }),
    );
    expect(options).toMatchObject({
      theme: 'light',
      layout: 'horizontal',
      lang: 'ru',
      accent: '#ff0000',
      radius: 8,
      width: 400,
      hide: ['cover', 'album'],
      coverColors: true,
      link: false,
      refresh: 30,
    });
  });

  it('falls back on invalid values and clamps numbers', () => {
    const options = parseOptions(
      read({
        theme: 'neon',
        accent: 'red',
        font: 'x;y{}',
        radius: '999',
        width: 'wide',
        refresh: '1',
      }),
    );
    expect(options).toMatchObject({
      theme: defaultOptions.theme,
      accent: null,
      font: null,
      radius: 48,
      width: defaultOptions.width,
      refresh: 3,
    });
  });
});

describe('cover effects', () => {
  it('are off by default and switch on with an attribute', () => {
    expect(parseOptions(read({}))).toMatchObject({ coverBlur: false, coverBleed: false });
    expect(parseOptions(read({ 'cover-blur': 'true', 'cover-bleed': '' }))).toMatchObject({
      coverBlur: true,
      coverBleed: true,
    });
    expect(parseOptions(read({ 'cover-blur': 'false' })).coverBlur).toBe(false);
  });
});

describe('spacing', () => {
  it('has a default and clamps to its range', () => {
    expect(parseOptions(read({}))).toMatchObject({ padding: 18, gap: 14 });
    expect(parseOptions(read({ padding: '0', gap: '30' }))).toMatchObject({ padding: 0, gap: 30 });
    expect(parseOptions(read({ padding: '500', gap: '-4' }))).toMatchObject({
      padding: 48,
      gap: 0,
    });
  });
});

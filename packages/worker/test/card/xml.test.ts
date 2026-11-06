import { describe, expect, it } from 'vitest';
import { fitText } from '#worker/card/xml.ts';

describe('fitText', () => {
  it('keeps text that fits', () => {
    expect(fitText('Better Than You', 280, 14)).toBe('Better Than You');
  });

  it('cuts by real glyph widths, narrow letters fit more than wide ones', () => {
    const narrow = fitText('illlllllllllllllllllllllllllllll', 100, 14);
    const wide = fitText('WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', 100, 14);
    expect(narrow.length).toBeGreaterThan(wide.length);
    expect(wide.endsWith('…')).toBe(true);
  });

  it('is tighter for bold text', () => {
    const text = 'The Windmills Of Your Mind and more words';
    expect(fitText(text, 200, 14, 650).length).toBeLessThan(fitText(text, 200, 14).length);
  });

  it('always keeps at least one character', () => {
    expect(fitText('Hello', 1, 14)).toBe('H…');
  });
});

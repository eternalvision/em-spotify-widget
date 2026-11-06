import { describe, expect, it } from 'vitest';
import {
  attributesOf,
  embedPath,
  iframeSnippet,
  imageSnippet,
  relevant,
  scriptSnippet,
  withQuery,
} from '#widget/configurator/snippets.ts';

const origin = 'https://example.test';

describe('snippets', () => {
  it('writes the attributes in order', () => {
    expect(attributesOf({ theme: 'light', radius: '8' })).toBe(' theme="light" radius="8"');
  });

  it('adds a query only when there are values', () => {
    expect(withQuery('/card.svg', {})).toBe('/card.svg');
    expect(withQuery('/card.svg', { theme: 'light', 'cover-colors': 'true' })).toBe(
      '/card.svg?theme=light&cover-colors=true',
    );
  });

  it('keeps only the options the widget understands', () => {
    const values = { theme: 'light', layout: 'horizontal', range: 'long', count: '3' } as const;
    expect(relevant('now-playing', values)).toEqual({ theme: 'light', layout: 'horizontal' });
    expect(relevant('top-tracks', values)).toEqual({ theme: 'light', range: 'long', count: '3' });
    expect(relevant('profile', values)).toEqual({ theme: 'light' });
  });

  it('writes the tag of each widget', () => {
    expect(scriptSnippet(origin, 'now-playing', { theme: 'light' })).toContain(
      '<spotify-widget theme="light"></spotify-widget>',
    );
    expect(scriptSnippet(origin, 'recent', {})).toContain('<spotify-recent></spotify-recent>');
    expect(scriptSnippet(origin, 'pill', {})).toContain('<spotify-pill></spotify-pill>');
  });

  it('names the widget in the embed address, except for the card', () => {
    expect(embedPath('now-playing', { theme: 'light' })).toBe('/embed?theme=light');
    expect(embedPath('queue', { count: '3' })).toBe('/embed?widget=queue&count=3');
  });

  it('sizes the iframe for the widget', () => {
    expect(iframeSnippet(origin, 'now-playing', { layout: 'horizontal' })).toContain(
      'height="204"',
    );
    expect(iframeSnippet(origin, 'now-playing', {})).toContain('height="506"');
    expect(iframeSnippet(origin, 'now-playing', { 'cover-bleed': 'true', width: '400' })).toContain(
      'height="604"',
    );
    expect(iframeSnippet(origin, 'pill', {})).toContain('height="58"');
    expect(
      iframeSnippet(origin, 'now-playing', { 'cover-bleed': 'true', gap: '30', padding: '10' }),
    ).toContain('height="532"');
    expect(iframeSnippet(origin, 'recent', { count: '3' })).toContain('height="244"');
  });

  it('builds the image snippet', () => {
    expect(imageSnippet(origin, {})).toBe(
      '<img src="https://example.test/card.svg" alt="Spotify">',
    );
  });
});

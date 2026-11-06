import { defaultOptions } from '@em-spotify/shared/options';
import { describe, expect, it } from 'vitest';
import { renderCard } from '#worker/card/card.ts';
import { playingCard } from '#worker/card/svg.ts';
import { mockNowPlaying } from '#worker/spotify/mock.ts';

const playing = mockNowPlaying(60_000);

describe('renderCard', () => {
  it('draws the idle card with the idle text', async () => {
    const svg = await renderCard(defaultOptions, { state: 'idle', track: null, fetchedAt: 0 });
    expect(svg).toContain('Not playing');
    expect(svg).not.toContain('class="bar"');
  });

  it('draws title, artist, cover, bars and progress for a playing track', async () => {
    const svg = await renderCard(defaultOptions, playing);
    expect(svg).toContain('Neon Skyline');
    expect(svg).toContain('The Demo Band');
    expect(svg).toContain('<image');
    expect(svg.match(/class="bar( unlit)?"/g)).toHaveLength(40);
    expect(svg).toContain('1:00');
    expect(svg).toContain('3:35');
  });

  it('freezes the bars and the progress when paused', async () => {
    const svg = await renderCard(defaultOptions, { ...playing, state: 'paused' });
    expect(svg).not.toContain('class="bar"');
    expect(svg).toContain('Paused on');
  });

  it('escapes text from Spotify', async () => {
    const track = { ...playing.track!, title: '<b>&"x"' };
    const svg = await renderCard(defaultOptions, { ...playing, track });
    expect(svg).toContain('&lt;b&gt;&amp;&quot;x&quot;');
    expect(svg).not.toContain('<b>');
  });

  it('hides the parts it is told to hide', async () => {
    const svg = await renderCard(
      { ...defaultOptions, hide: ['cover', 'equalizer', 'progress', 'album'] },
      playing,
    );
    expect(svg).not.toContain('<image');
    expect(svg).not.toContain('class="bar"');
    expect(svg).not.toContain('Local Sessions');
  });

  it('lays out horizontally and takes colors and size', async () => {
    const svg = await renderCard(
      { ...defaultOptions, layout: 'horizontal', width: 400, background: '#ff0000' },
      playing,
    );
    expect(svg).toContain('width="400"');
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toMatch(/height="1\d\d(\.\d+)?"/);
  });

  it('writes the language of the label', async () => {
    const svg = await renderCard({ ...defaultOptions, lang: 'ru' }, playing);
    expect(svg).toContain('Сейчас играет в');
  });
});

describe('card effects', () => {
  it('draws the listening bar between the two times', async () => {
    const svg = await renderCard(defaultOptions, playing);
    expect(svg.indexOf('1:00')).toBeLessThan(svg.indexOf('animation:grow'));
    expect(svg.indexOf('animation:grow')).toBeLessThan(svg.indexOf('3:35'));
  });

  it('lights the bars that are still to come, at the moment the track reaches them', async () => {
    const svg = await renderCard(defaultOptions, playing);
    expect(svg).toContain('bar unlit');
    expect(svg).toContain('@keyframes lit');
    expect(svg).toMatch(/--ld:[1-9]\d*\.\d\ds/);
  });

  it('keeps every bar lit and drops the listening bar without progress', async () => {
    const svg = await renderCard({ ...defaultOptions, hide: ['progress'] }, playing);
    expect(svg).not.toContain('bar unlit');
    expect(svg).not.toContain('animation:grow');
  });

  it('puts the cover behind the card, blurred, only when asked', async () => {
    const plain = await renderCard(defaultOptions, playing);
    expect(plain).not.toContain('id="blur"');
    const blurred = await renderCard({ ...defaultOptions, coverBlur: true }, playing);
    expect(blurred).toContain('id="blur"');
    expect(blurred.match(/<image /g)).toHaveLength(2);
  });

  it('blurs the cover even when the cover itself is hidden', async () => {
    const svg = await renderCard({ ...defaultOptions, coverBlur: true, hide: ['cover'] }, playing);
    expect(svg).toContain('id="blur"');
    expect(svg.match(/<image /g)).toHaveLength(1);
  });

  it('pushes the cover to the top, left and right edges', async () => {
    const svg = await renderCard({ ...defaultOptions, coverBleed: true }, playing);
    expect(svg).toContain('<clipPath id="c"><rect x="0" y="0" width="320" height="320" rx="0"/>');
  });

  it('pushes the horizontal cover to the top, left and bottom edges', async () => {
    const svg = await renderCard(
      { ...defaultOptions, layout: 'horizontal', coverBleed: true },
      playing,
    );
    expect(svg).toMatch(/<clipPath id="c"><rect x="0" y="0" width="96" height="\d+/);
  });

  it('draws the cover without a border', async () => {
    const svg = await renderCard(defaultOptions, playing);
    expect(svg.match(/stroke=/g)).toHaveLength(1);
  });

  it('colors the card from the cover accent only when asked', () => {
    const on = { ...defaultOptions, coverColors: true };
    expect(playingCard(on, playing, playing.track!, null, '#ff8800')).toContain('fill="#ff8800"');
    expect(playingCard(defaultOptions, playing, playing.track!, null, '#ff8800')).not.toContain(
      '#ff8800',
    );
  });
});

describe('spacing', () => {
  it('moves the cover with the padding and the text with the gap', async () => {
    const base = await renderCard(defaultOptions, playing);
    const roomy = await renderCard({ ...defaultOptions, padding: 30, gap: 40 }, playing);
    expect(base).toContain('<clipPath id="c"><rect x="18" y="18" width="284"');
    expect(roomy).toContain('<clipPath id="c"><rect x="30" y="30" width="260"');
    const height = (svg: string): number => Number(/height="(\d+(?:\.\d+)?)"/.exec(svg)?.[1]);
    expect(height(roomy)).toBeGreaterThan(height(base) - 40);
  });

  it('lets the cover touch the edge with no padding', async () => {
    const svg = await renderCard({ ...defaultOptions, padding: 0 }, playing);
    expect(svg).toContain('<clipPath id="c"><rect x="0" y="0" width="320"');
  });

  it('puts the space after a bleeding cover where it is asked', async () => {
    const tight = await renderCard({ ...defaultOptions, coverBleed: true, gap: 4 }, playing);
    const loose = await renderCard({ ...defaultOptions, coverBleed: true, gap: 40 }, playing);
    const height = (svg: string): number =>
      Number(/<svg[^>]*height="(\d+(?:\.\d+)?)"/.exec(svg)?.[1]);
    expect(height(loose) - height(tight)).toBe(36);
  });

  it('sizes the idle card by the padding', async () => {
    const svg = await renderCard(
      { ...defaultOptions, padding: 30 },
      { state: 'idle', track: null, fetchedAt: 0 },
    );
    expect(svg).toContain('height="84"');
  });
});

describe('cover glow', () => {
  it('lights the card under the cover like the widget does', async () => {
    const svg = await renderCard(defaultOptions, playing);
    expect(svg).toContain('<filter id="glow"');
    expect(svg.indexOf('id="glow"')).toBeLessThan(svg.indexOf('<image '));
  });

  it('has no glow when the cover is pushed to the edges', async () => {
    const svg = await renderCard({ ...defaultOptions, coverBleed: true }, playing);
    expect(svg).not.toContain('id="glow"');
  });

  it('takes the glow color from the accent', async () => {
    const svg = await renderCard({ ...defaultOptions, accent: '#ff8800' }, playing);
    expect(svg).toMatch(/fill="#ff8800" fill-opacity="0.45" filter="url\(#glow\)"/);
  });
});

describe('cover corners', () => {
  const radiusOf = (svg: string): number =>
    Number(/<clipPath id="c"><rect [^>]*rx="(\d+)"/.exec(svg)?.[1]);

  it('follow the radius of the card', async () => {
    expect(radiusOf(await renderCard({ ...defaultOptions, radius: 18 }, playing))).toBe(14);
    expect(radiusOf(await renderCard({ ...defaultOptions, radius: 40 }, playing))).toBe(31);
    expect(radiusOf(await renderCard({ ...defaultOptions, radius: 0 }, playing))).toBe(0);
  });

  it('keep the glow when the corners are square', async () => {
    const svg = await renderCard({ ...defaultOptions, radius: 0 }, playing);
    expect(svg).toContain('id="glow"');
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import '#widget/widget.ts';
import { deepAll } from './deep.ts';

const track = {
  id: 't1',
  title: 'Song',
  artists: ['A', 'B'],
  album: 'Album',
  coverUrl: 'https://img/cover.jpg',
  thumbUrl: null,
  url: 'https://open.spotify.com/track/t1',
  durationMs: 200_000,
  progressMs: 50_000,
};

const stubApi = (body: unknown) => {
  const fetchMock = vi.fn((_input: unknown, _init?: unknown) =>
    Promise.resolve(new Response(JSON.stringify(body))),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const part = (element: Element, name: string): HTMLElement | undefined =>
  deepAll(element.shadowRoot ?? element, `[data-part="${name}"]`)[0];

const shows = (element: Element, name: string): boolean => {
  const target = part(element, name);
  return target !== undefined && getComputedStyle(target).display !== 'none';
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

const make = async (attributes: Record<string, string> = {}) => {
  const element = document.createElement('spotify-widget');
  element.setAttribute('api', 'https://api.test');
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
  document.body.append(element);
  await vi.waitFor(() => {
    expect(fetch).toHaveBeenCalled();
  });
  await settle();
  return element;
};

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('<spotify-widget>', () => {
  it('shows the playing track from the api of the attribute', async () => {
    const fetchMock = stubApi({ state: 'playing', fetchedAt: 1, track });
    const element = await make();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('https://api.test/api/now-playing');
    expect(part(element, 'title')?.textContent).toBe('Song');
    expect(part(element, 'artist')?.textContent).toBe('A, B');
    expect(part(element, 'album')?.textContent).toBe('Album');
    expect(part(element, 'label-text')?.textContent).toBe('Now playing on');
    expect(part(element, 'card')?.dataset.state).toBe('playing');
  });

  it('shows only the idle text when nothing plays', async () => {
    stubApi({ state: 'idle', fetchedAt: 1, track: null });
    const element = await make({ lang: 'ru' });
    expect(part(element, 'card')?.dataset.state).toBe('idle');
    expect(part(element, 'label-text')?.textContent).toBe('Ничего не играет');
    expect(shows(element, 'title')).toBe(false);
    expect(shows(element, 'equalizer')).toBe(false);
    expect(shows(element, 'cover')).toBe(false);
  });

  it('marks a paused track', async () => {
    stubApi({ state: 'paused', fetchedAt: 1, track });
    const element = await make();
    expect(part(element, 'label-text')?.textContent).toBe('Paused on');
  });

  it('links to the track unless the link is off', async () => {
    stubApi({ state: 'playing', fetchedAt: 1, track });
    const linked = await make();
    expect(part(linked, 'card')?.getAttribute('href')).toBe(track.url);
    const plain = await make({ link: 'false' });
    expect(part(plain, 'card')?.getAttribute('href')).toBe('');
  });

  it('hides the parts it is told to hide', async () => {
    stubApi({ state: 'playing', fetchedAt: 1, track });
    const element = await make({ hide: 'cover,equalizer,album' });
    expect(shows(element, 'cover')).toBe(false);
    expect(shows(element, 'equalizer')).toBe(false);
    expect(shows(element, 'album')).toBe(false);
    expect(shows(element, 'title')).toBe(true);
    expect(shows(element, 'progress')).toBe(true);
  });

  it('takes the layout and the size from the attributes', async () => {
    stubApi({ state: 'playing', fetchedAt: 1, track });
    const element = await make({ layout: 'horizontal', width: '400' });
    expect(part(element, 'card')?.dataset.layout).toBe('horizontal');
    expect(element.style.width).toBe('400px');
  });

  it('follows the attributes', async () => {
    stubApi({ state: 'playing', fetchedAt: 1, track });
    const element = await make();
    element.setAttribute('lang', 'cs');
    await settle();
    expect(part(element, 'label-text')?.textContent).toBe('Právě hraje na');
  });

  it('draws the waveform, lights the played part and counts the time', async () => {
    stubApi({ state: 'playing', fetchedAt: 1, track });
    const element = await make();
    const bars = deepAll(element.shadowRoot ?? element, '[data-part="bar"]');
    expect(bars).toHaveLength(40);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(part(element, 'elapsed')?.textContent).toBe('0:50');
    expect(part(element, 'total')?.textContent).toBe('3:20');
    expect(bars[0]?.style.opacity).toBe('1');
    expect(bars[39]?.style.opacity).toBe('0.28');
  });

  it('lays the text over the cover in the square layout', async () => {
    stubApi({ state: 'playing', fetchedAt: 1, track });
    const square = await make({ layout: 'square' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(part(square, 'card')?.getAttribute('data-layout')).toBe('square');
    expect(shows(square, 'scrim')).toBe(true);
    const vertical = await make();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(shows(vertical, 'scrim')).toBe(false);
  });

  it('keeps every bar lit when the wave progress is hidden', async () => {
    stubApi({ state: 'playing', fetchedAt: 1, track });
    const element = await make({ hide: 'wave-progress' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    const bars = deepAll(element.shadowRoot ?? element, '[data-part="bar"]');
    expect(bars.every((bar) => bar.style.opacity === '1')).toBe(true);
    expect(shows(element, 'progress')).toBe(true);
  });

  it('keeps the wave progress when only the listening bar is hidden', async () => {
    stubApi({ state: 'playing', fetchedAt: 1, track });
    const element = await make({ hide: 'progress' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    const bars = deepAll(element.shadowRoot ?? element, '[data-part="bar"]');
    expect(bars.some((bar) => bar.style.opacity !== '1')).toBe(true);
    expect(shows(element, 'progress')).toBe(false);
  });
});

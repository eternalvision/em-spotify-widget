import { afterEach, describe, expect, it, vi } from 'vitest';
import '#widget/widget.ts';
import { pillRadius } from '#widget/pill/pill.ts';
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
  vi.stubGlobal(
    'fetch',
    vi.fn((_input: unknown, _init?: unknown) =>
      Promise.resolve(new Response(JSON.stringify(body))),
    ),
  );
};

const make = async (tag: string, attributes: Record<string, string> = {}) => {
  const element = document.createElement(tag);
  element.setAttribute('api', 'https://api.test');
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
  document.body.append(element);
  await vi.waitFor(() => {
    expect(fetch).toHaveBeenCalled();
  });
  await new Promise((resolve) => setTimeout(resolve, 30));
  return element;
};

const part = (element: Element, name: string): HTMLElement | undefined =>
  deepAll(element.shadowRoot ?? element, `[data-part="${name}"]`)[0];

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('<spotify-pill>', () => {
  it('shows the track in one row', async () => {
    stubApi({ state: 'playing', fetchedAt: 1, track });
    const element = await make('spotify-pill');
    expect(part(element, 'title')?.textContent).toBe('Song');
    expect(part(element, 'artist')?.textContent).toBe('A, B');
    expect(part(element, 'card')?.dataset.state).toBe('playing');
    expect(part(element, 'card')?.getAttribute('href')).toBe(track.url);
  });

  it('shows the idle text when nothing plays', async () => {
    stubApi({ state: 'idle', fetchedAt: 1, track: null });
    const element = await make('spotify-pill', { lang: 'cs' });
    expect(part(element, 'title')?.textContent).toBe('Nic nehraje');
  });

  it('rounds fully unless a radius is given', () => {
    expect(pillRadius(false, 18)).toBe(999);
    expect(pillRadius(true, 8)).toBe(8);
  });
});

describe('<spotify-vinyl>', () => {
  it('shows the record with the track under it', async () => {
    stubApi({ state: 'playing', fetchedAt: 1, track });
    const element = await make('spotify-vinyl');
    expect(part(element, 'title')?.textContent).toBe('Song');
    expect(part(element, 'artist')?.textContent).toBe('A, B');
    expect(part(element, 'label-text')?.textContent).toBe('Now playing on');
    expect(part(element, 'card')?.dataset.state).toBe('playing');
  });

  it('shows the idle text when nothing plays', async () => {
    stubApi({ state: 'idle', fetchedAt: 1, track: null });
    const element = await make('spotify-vinyl');
    expect(part(element, 'card')?.dataset.state).toBe('idle');
    expect(part(element, 'label-text')?.textContent).toBe('Not playing');
  });
});

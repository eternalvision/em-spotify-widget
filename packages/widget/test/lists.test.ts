import { afterEach, describe, expect, it, vi } from 'vitest';
import '#widget/widget.ts';
import { agoOf } from '#widget/lists/specs.ts';
import { deepAll } from './deep.ts';

const summary = (id: string, title: string) => ({
  id,
  title,
  artists: ['Artist'],
  album: 'Album',
  coverUrl: 'https://img/cover.jpg',
  thumbUrl: null,
  url: `https://open.spotify.com/track/${id}`,
  durationMs: 185_000,
});

const routes: Record<string, unknown> = {
  '/api/recent': {
    fetchedAt: 1,
    items: [
      { track: summary('1', 'First'), playedAt: Date.now() - 5 * 60_000 },
      { track: summary('2', 'Second'), playedAt: Date.now() - 3 * 3_600_000 },
      { track: summary('3', 'Third'), playedAt: Date.now() - 4 * 3_600_000 },
    ],
  },
  '/api/top-tracks': {
    fetchedAt: 1,
    items: [summary('1', 'One'), summary('2', 'Two')],
  },
  '/api/top-artists': {
    fetchedAt: 1,
    items: [
      {
        id: 'a1',
        name: 'Band',
        url: 'https://x',
        imageUrl: null,
        genres: ['indie', 'pop', 'rock'],
        followers: 10,
      },
    ],
  },
  '/api/queue': { fetchedAt: 1, current: summary('now', 'Now'), next: [summary('7', 'Next one')] },
  '/api/playlists': {
    fetchedAt: 1,
    items: [{ id: 'p1', name: 'Focus', url: 'https://x', imageUrl: null, tracks: 24 }],
  },
  '/api/profile': {
    fetchedAt: 1,
    id: 'u',
    name: 'Demo Listener',
    url: 'https://open.spotify.com/user/u',
    imageUrl: null,
    followers: 1280,
  },
};

const stubApi = () => {
  const fetchMock = vi.fn((input: unknown, _init?: unknown) => {
    const { pathname } = new URL(String(input));
    const body = routes[pathname];
    return Promise.resolve(
      body === undefined ? new Response('no', { status: 404 }) : new Response(JSON.stringify(body)),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
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

const all = (element: Element, name: string): HTMLElement[] =>
  deepAll(element.shadowRoot ?? element, `[data-part="${name}"]`);

const texts = (element: Element, name: string): string[] =>
  all(element, name).map((item) => item.textContent);

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('agoOf', () => {
  it('counts minutes, hours and days', () => {
    const now = Date.now();
    expect(agoOf(now - 5 * 60_000, now, 'en')).toBe('5 min. ago');
    expect(agoOf(now - 3 * 3_600_000, now, 'en')).toBe('3 hr. ago');
    expect(agoOf(now - 72 * 3_600_000, now, 'en')).toBe('3 days ago');
  });
});

describe('list widgets', () => {
  it('lists the recently played tracks with their time', async () => {
    stubApi();
    const element = await make('spotify-recent');
    expect(texts(element, 'heading-text')).toEqual(['Recently played']);
    expect(texts(element, 'title')).toEqual(['First', 'Second', 'Third']);
    expect(texts(element, 'subtitle')).toEqual(['Artist', 'Artist', 'Artist']);
    expect(texts(element, 'meta')[0]).toBe('5 min. ago');
  });

  it('shows only as many items as asked', async () => {
    stubApi();
    const element = await make('spotify-recent', { count: '2' });
    expect(texts(element, 'title')).toEqual(['First', 'Second']);
  });

  it('asks the api for the period and numbers the top tracks', async () => {
    const fetchMock = stubApi();
    const element = await make('spotify-top-tracks', { range: 'long' });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://api.test/api/top-tracks?range=long');
    expect(texts(element, 'rank')).toEqual(['1', '2']);
    expect(texts(element, 'meta')).toEqual(['3:05', '3:05']);
  });

  it('shows the artists with their genres', async () => {
    stubApi();
    const element = await make('spotify-top-artists', { lang: 'ru' });
    expect(texts(element, 'heading-text')).toEqual(['Топ исполнителей']);
    expect(texts(element, 'title')).toEqual(['Band']);
    expect(texts(element, 'subtitle')).toEqual(['indie, pop']);
  });

  it('shows what plays next', async () => {
    stubApi();
    const element = await make('spotify-queue');
    expect(texts(element, 'heading-text')).toEqual(['Up next']);
    expect(texts(element, 'title')).toEqual(['Next one']);
  });

  it('shows the playlists with their size', async () => {
    stubApi();
    const element = await make('spotify-playlists');
    expect(texts(element, 'title')).toEqual(['Focus']);
    expect(texts(element, 'meta')).toEqual(['24 tracks']);
  });

  it('links the rows unless the link is off', async () => {
    stubApi();
    const linked = await make('spotify-top-tracks');
    expect(all(linked, 'row')[0]?.getAttribute('href')).toBe('https://open.spotify.com/track/1');
    const plain = await make('spotify-top-tracks', { link: 'false' });
    expect(all(plain, 'row')[0]?.getAttribute('href')).toBe('');
  });

  it('hides the parts it is told to hide', async () => {
    stubApi();
    const element = await make('spotify-recent', { hide: 'heading,artist' });
    const display = (name: string) => getComputedStyle(all(element, name)[0]).display;
    expect(display('heading')).toBe('none');
    expect(display('subtitle')).toBe('none');
    expect(display('title')).not.toBe('none');
  });

  it('says so when Spotify cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('no', { status: 502 }))),
    );
    const element = document.createElement('spotify-recent');
    element.setAttribute('api', 'https://api.test');
    document.body.append(element);
    await vi.waitFor(
      () => {
        expect(texts(element, 'message')[0]).toBe('Spotify is not available');
      },
      { timeout: 3000 },
    );
  });

  it('shows the profile with a short follower count', async () => {
    stubApi();
    const element = await make('spotify-profile');
    expect(texts(element, 'title')).toEqual(['Demo Listener']);
    expect(texts(element, 'subtitle')[0]).toContain('followers');
    expect(all(element, 'row')[0]?.getAttribute('href')).toBe('https://open.spotify.com/user/u');
  });
});

import { describe, expect, it } from 'vitest';
import worker from '#worker/index.ts';

const env = { MOCK: 'true' } as unknown as Env;
const ctx = {
  waitUntil: () => undefined,
  passThroughOnException: () => undefined,
} as unknown as ExecutionContext;

const get = (path: string, method = 'GET') =>
  worker.fetch(new Request(`https://widget.test${path}`, { method }), env, ctx);

describe('worker routes', () => {
  it('serves the playback state as JSON with CORS', async () => {
    const response = await get('/api/now-playing');
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(await response.json()).toMatchObject({
      state: 'playing',
      track: { title: 'Neon Skyline' },
    });
  });

  it('serves the SVG card with the options of the query', async () => {
    const response = await get('/card.svg?width=400&theme=light');
    expect(response.headers.get('content-type')).toContain('image/svg+xml');
    expect(await response.text()).toContain('width="400"');
  });

  it('serves the embed page and keeps only known attributes, escaped', async () => {
    const html = await (await get('/embed?theme=light&evil=1&font=%22%3E%3Cscript%3E')).text();
    expect(html).toContain('<spotify-widget theme="light" font="&quot;&gt;&lt;script&gt;">');
    expect(html).not.toContain('evil');
    expect(html).toContain('<script src="/widget.js"></script>');
  });

  it('serves every list endpoint in mock mode', async () => {
    const paths = [
      '/api/recent',
      '/api/top-tracks?range=long',
      '/api/top-artists',
      '/api/queue',
      '/api/profile',
      '/api/playlists',
    ];
    for (const path of paths) {
      const response = await get(path);
      expect(response.status, path).toBe(200);
      expect(await response.json(), path).toHaveProperty('fetchedAt');
    }
  });

  it('answers 404 for an unknown api path', async () => {
    expect((await get('/api/nope')).status).toBe(404);
  });

  it('embeds the widget named in the query', async () => {
    const html = await (await get('/embed?widget=top-artists&count=3')).text();
    expect(html).toContain('<spotify-top-artists count="3"></spotify-top-artists>');
    const fallback = await (await get('/embed?widget=nope')).text();
    expect(fallback).toContain('<spotify-widget></spotify-widget>');
  });

  it('refuses other methods and unknown paths', async () => {
    expect((await get('/api/now-playing', 'POST')).status).toBe(405);
    expect((await get('/nope')).status).toBe(404);
  });

  it('answers 502 when Spotify cannot be reached', async () => {
    const response = await worker.fetch(
      new Request('https://widget.test/api/now-playing'),
      { MOCK: 'false' } as unknown as Env,
      ctx,
    );
    expect(response.status).toBe(502);
  });
});

import { parseOptions, rangeNames } from '@em-spotify/shared/options';
import { renderCard } from '#worker/card/card.ts';
import { embedPage } from '#worker/embed.ts';
import { loadNowPlaying } from '#worker/spotify/now-playing.ts';
import {
  loadPlaylists,
  loadProfile,
  loadQueue,
  loadRecent,
  loadTopArtists,
  loadTopTracks,
  type Range,
} from '#worker/spotify/resources.ts';

const corsHeaders = { 'access-control-allow-origin': '*' };

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

const failure = (error: unknown): Response => {
  console.error(
    JSON.stringify({
      message: 'request failed',
      error: error instanceof Error ? error.message : 'unknown',
    }),
  );
  return json({ error: 'unavailable' }, 502);
};

const rangeOf = (url: URL): Range => {
  const value = url.searchParams.get('range');
  return rangeNames.find((name) => name === value) ?? 'medium';
};

const apiRoute = async (url: URL, env: Env, ctx: ExecutionContext): Promise<Response> => {
  switch (url.pathname) {
    case '/api/now-playing':
      return json(await loadNowPlaying(env, ctx));
    case '/api/recent':
      return json(await loadRecent(env, ctx));
    case '/api/top-tracks':
      return json(await loadTopTracks(env, ctx, rangeOf(url)));
    case '/api/top-artists':
      return json(await loadTopArtists(env, ctx, rangeOf(url)));
    case '/api/queue':
      return json(await loadQueue(env, ctx));
    case '/api/profile':
      return json(await loadProfile(env, ctx));
    case '/api/playlists':
      return json(await loadPlaylists(env, ctx));
    default:
      return json({ error: 'not_found' }, 404);
  }
};

const cardRoute = async (url: URL, env: Env, ctx: ExecutionContext): Promise<Response> => {
  const options = parseOptions((name) => url.searchParams.get(name));
  const svg = await renderCard(options, await loadNowPlaying(env, ctx));
  return new Response(svg, {
    headers: {
      ...corsHeaders,
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=5',
    },
  });
};

const embedRoute = (url: URL): Response =>
  new Response(embedPage(url.searchParams), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60' },
  });

const route = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) {
    return apiRoute(url, env, ctx);
  }
  switch (url.pathname) {
    case '/card.svg':
      return cardRoute(url, env, ctx);
    case '/embed':
      return embedRoute(url);
    default:
      return json({ error: 'not_found' }, 404);
  }
};

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return json({ error: 'method_not_allowed' }, 405);
    }
    try {
      return await route(request, env, ctx);
    } catch (error) {
      return failure(error);
    }
  },
} satisfies ExportedHandler<Env>;

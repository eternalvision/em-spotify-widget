const origin = 'https://cache.internal/';

const cacheOf = (): Cache | null => (typeof caches === 'undefined' ? null : caches.default);

export interface Cached<T> {
  value: T;
  hit: boolean;
}

export const cachedJson = async <T>(
  ctx: ExecutionContext,
  key: string,
  seconds: number,
  parse: (value: unknown) => T | null,
  load: () => Promise<T>,
): Promise<Cached<T>> => {
  const cache = cacheOf();
  const request = `${origin}${key}`;
  const stored = await cache?.match(request);
  const parsed = stored ? parse(await stored.json()) : null;
  if (parsed !== null) {
    return { value: parsed, hit: true };
  }
  const value = await load();
  const write = cache?.put(
    request,
    new Response(JSON.stringify(value), {
      headers: { 'cache-control': `max-age=${seconds}`, 'content-type': 'application/json' },
    }),
  );
  if (write) {
    ctx.waitUntil(write);
  }
  return { value, hit: false };
};

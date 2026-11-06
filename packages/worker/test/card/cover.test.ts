import { encode } from 'jpeg-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { coverAccent, coverDataUri } from '#worker/card/cover.ts';

const solid = (red: number, green: number, blue: number): Uint8Array => {
  const size = 8;
  const data = new Uint8Array(size * size * 4);
  for (let index = 0; index < data.length; index += 4) {
    data.set([red, green, blue, 255], index);
  }
  return new Uint8Array(encode({ data, width: size, height: size }, 90).data);
};

const serve = (body: Uint8Array, type = 'image/jpeg', status = 200) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(body, { status, headers: { 'content-type': type } }))),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('coverAccent', () => {
  it('reads the color of a JPEG cover', async () => {
    serve(solid(220, 30, 30));
    const accent = await coverAccent('https://img/cover.jpg');
    expect(accent).toMatch(/^#[0-9a-f]{6}$/);
    const red = parseInt(accent?.slice(1, 3) ?? '0', 16);
    const blue = parseInt(accent?.slice(5, 7) ?? '0', 16);
    expect(red).toBeGreaterThan(blue);
  });

  it('gives nothing for a missing, broken or inline cover', async () => {
    expect(await coverAccent(null)).toBeNull();
    expect(await coverAccent('data:image/svg+xml;utf8,x')).toBeNull();
    serve(new Uint8Array([1, 2, 3]));
    expect(await coverAccent('https://img/broken.jpg')).toBeNull();
    serve(new Uint8Array(), 'image/jpeg', 404);
    expect(await coverAccent('https://img/gone.jpg')).toBeNull();
  });
});

describe('coverDataUri', () => {
  it('inlines the image with its type', async () => {
    serve(solid(1, 2, 3));
    const uri = await coverDataUri('https://img/cover.jpg');
    expect(uri).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('passes inline images through', async () => {
    expect(await coverDataUri('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
    expect(await coverDataUri(null)).toBeNull();
  });
});

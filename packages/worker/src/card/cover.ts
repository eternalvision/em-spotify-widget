import { accentOfPixels } from '@em-spotify/shared/cover-color';
import { decode } from 'jpeg-js';

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let start = 0; start < bytes.length; start += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  }
  return btoa(binary);
};

const fetchImage = async (url: string): Promise<Response | null> => {
  const response = await fetch(url, { cf: { cacheEverything: true, cacheTtl: 86_400 } });
  return response.ok ? response : null;
};

export const coverDataUri = async (url: string | null): Promise<string | null> => {
  if (!url) {
    return null;
  }
  if (url.startsWith('data:')) {
    return url;
  }
  const response = await fetchImage(url);
  if (!response) {
    return null;
  }
  const type = response.headers.get('content-type') ?? 'image/jpeg';
  return `data:${type};base64,${toBase64(new Uint8Array(await response.arrayBuffer()))}`;
};

export const coverAccent = async (url: string | null): Promise<string | null> => {
  if (!url || url.startsWith('data:')) {
    return null;
  }
  try {
    const response = await fetchImage(url);
    if (!response) {
      return null;
    }
    const image = decode(new Uint8Array(await response.arrayBuffer()), {
      useTArray: true,
      formatAsRGBA: true,
      maxMemoryUsageInMB: 32,
    });
    return accentOfPixels(image.data);
  } catch {
    return null;
  }
};

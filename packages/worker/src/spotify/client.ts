import { accessTokenOf } from '#worker/spotify/token.ts';

const base = 'https://api.spotify.com/v1';

export const spotifyGet = async (env: Env, path: string, now: number): Promise<unknown> => {
  const token = await accessTokenOf(env, now);
  const response = await fetch(`${base}${path}`, { headers: { authorization: `Bearer ${token}` } });
  if (response.status === 204) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`spotify request ${path.split('?')[0] ?? path} failed with ${response.status}`);
  }
  return response.json();
};

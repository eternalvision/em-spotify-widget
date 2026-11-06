import type { CardOptions } from '@em-spotify/shared/options';
import type { NowPlaying } from '@em-spotify/shared/types';
import { coverAccent, coverDataUri } from '#worker/card/cover.ts';
import { idleCard, playingCard } from '#worker/card/svg.ts';

const wantsCover = (options: CardOptions): boolean =>
  !options.hide.includes('cover') || options.coverBlur;

export const renderCard = async (options: CardOptions, data: NowPlaying): Promise<string> => {
  if (data.state === 'idle' || !data.track) {
    return idleCard(options);
  }
  const { track } = data;
  const [cover, accent] = await Promise.all([
    wantsCover(options) ? coverDataUri(track.coverUrl) : null,
    options.coverColors ? coverAccent(track.thumbUrl ?? track.coverUrl) : null,
  ]);
  return playingCard(options, data, track, cover, accent);
};

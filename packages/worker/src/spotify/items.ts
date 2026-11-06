import { isRecord, listOf, numberOf, textOf } from '@em-spotify/shared/guards';
import type { TrackSummary } from '@em-spotify/shared/types';

export const lastImage = (holder: Record<string, unknown>): string | null => {
  const images = listOf(holder.images);
  const last = images.at(-1);
  return isRecord(last) ? textOf(last.url) : null;
};

export const firstImage = (holder: Record<string, unknown>): string | null => {
  const [first] = listOf(holder.images);
  return isRecord(first) ? textOf(first.url) : null;
};

const coverHolder = (item: Record<string, unknown>): Record<string, unknown> =>
  isRecord(item.album) ? item.album : item;

const coverOf = (item: Record<string, unknown>): string | null => firstImage(coverHolder(item));

const namesOf = (value: unknown): string[] =>
  listOf(value).flatMap((entry) =>
    isRecord(entry) ? [textOf(entry.name) ?? ''].filter(Boolean) : [],
  );

const artistsOf = (item: Record<string, unknown>): string[] =>
  isRecord(item.show) ? namesOf([item.show]) : namesOf(item.artists);

const albumOf = (item: Record<string, unknown>): string => {
  if (isRecord(item.album)) {
    return textOf(item.album.name) ?? '';
  }
  return isRecord(item.show) ? (textOf(item.show.publisher) ?? '') : '';
};

export const summaryOf = (value: unknown): TrackSummary | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = textOf(value.id);
  const title = textOf(value.name);
  const durationMs = numberOf(value.duration_ms);
  if (!id || !title || durationMs === null) {
    return null;
  }
  const links = isRecord(value.external_urls) ? value.external_urls : {};
  return {
    id,
    title,
    artists: artistsOf(value),
    album: albumOf(value),
    coverUrl: coverOf(value),
    thumbUrl: lastImage(coverHolder(value)),
    url: textOf(links.spotify) ?? `https://open.spotify.com/track/${id}`,
    durationMs,
  };
};

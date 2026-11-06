import type { CardOptions } from '@em-spotify/shared/options';
import {
  parsePlaylists,
  parseQueue,
  parseRecent,
  parseTopArtists,
  parseTopTracks,
} from '@em-spotify/shared/parse';
import { type ListTexts, listTexts } from '@em-spotify/shared/texts';
import { formatTime } from '@em-spotify/shared/time';
import type {
  Playlists,
  Queue,
  Recent,
  TopArtists,
  TopTracks,
  TrackSummary,
} from '@em-spotify/shared/types';

export interface RowModel {
  key: string;
  title: string;
  subtitle: string;
  meta: string;
  image: string | null;
  url: string;
  round: boolean;
  rank: number | null;
}

export interface ListSpec<T> {
  path: string;
  query: (options: CardOptions) => Record<string, string>;
  parse: (value: unknown) => T | null;
  heading: (texts: ListTexts) => string;
  subheading: (texts: ListTexts, options: CardOptions) => string;
  rows: (data: T, options: CardOptions) => RowModel[];
}

const trackRow = (track: TrackSummary, meta: string, rank: number | null): RowModel => ({
  key: `${track.id}:${meta}`,
  title: track.title,
  subtitle: track.artists.join(', '),
  meta,
  image: track.coverUrl,
  url: track.url,
  round: false,
  rank,
});

export const agoOf = (playedAt: number, now: number, lang: string): string => {
  const formatter = new Intl.RelativeTimeFormat(lang, { numeric: 'auto', style: 'short' });
  const minutes = Math.max(0, Math.round((now - playedAt) / 60_000));
  if (minutes < 60) {
    return formatter.format(-minutes, 'minute');
  }
  const hours = Math.round(minutes / 60);
  return hours < 48
    ? formatter.format(-hours, 'hour')
    : formatter.format(-Math.round(hours / 24), 'day');
};

const noQuery = (): Record<string, string> => ({});
const rangeQuery = (options: CardOptions): Record<string, string> => ({ range: options.range });

export const recentSpec: ListSpec<Recent> = {
  path: '/api/recent',
  query: noQuery,
  parse: parseRecent,
  heading: (texts) => texts.recent,
  subheading: () => '',
  rows: (data, options) =>
    data.items.map((item) =>
      trackRow(item.track, agoOf(item.playedAt, Date.now(), options.lang), null),
    ),
};

export const topTracksSpec: ListSpec<TopTracks> = {
  path: '/api/top-tracks',
  query: rangeQuery,
  parse: parseTopTracks,
  heading: (texts) => texts.topTracks,
  subheading: (texts, options) => texts.ranges[options.range],
  rows: (data) =>
    data.items.map((track, index) => trackRow(track, formatTime(track.durationMs), index + 1)),
};

export const topArtistsSpec: ListSpec<TopArtists> = {
  path: '/api/top-artists',
  query: rangeQuery,
  parse: parseTopArtists,
  heading: (texts) => texts.topArtists,
  subheading: (texts, options) => texts.ranges[options.range],
  rows: (data) =>
    data.items.map((artist, index) => ({
      key: artist.id,
      title: artist.name,
      subtitle: artist.genres.slice(0, 2).join(', '),
      meta: '',
      image: artist.imageUrl,
      url: artist.url,
      round: true,
      rank: index + 1,
    })),
};

export const queueSpec: ListSpec<Queue> = {
  path: '/api/queue',
  query: noQuery,
  parse: parseQueue,
  heading: (texts) => texts.queue,
  subheading: () => '',
  rows: (data) =>
    data.next.map((track, index) =>
      trackRow({ ...track, id: `${track.id}-${index}` }, formatTime(track.durationMs), null),
    ),
};

export const playlistsSpec: ListSpec<Playlists> = {
  path: '/api/playlists',
  query: noQuery,
  parse: parsePlaylists,
  heading: (texts) => texts.playlists,
  subheading: () => '',
  rows: (data, options) =>
    data.items.map((playlist) => ({
      key: playlist.id,
      title: playlist.name,
      subtitle: '',
      meta: `${playlist.tracks} ${listTexts[options.lang].tracks}`,
      image: playlist.imageUrl,
      url: playlist.url,
      round: false,
      rank: null,
    })),
};

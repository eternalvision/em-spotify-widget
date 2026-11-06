export type PlaybackState = 'playing' | 'paused' | 'idle';

export interface NowPlaying {
  state: PlaybackState;
  track: Track | null;
  fetchedAt: number;
}

export interface TrackSummary {
  id: string;
  title: string;
  artists: string[];
  album: string;
  coverUrl: string | null;
  thumbUrl: string | null;
  url: string;
  durationMs: number;
}

export interface Track extends TrackSummary {
  progressMs: number;
}

export interface RecentItem {
  track: TrackSummary;
  playedAt: number;
}

export interface Recent {
  items: RecentItem[];
  fetchedAt: number;
}

export interface TopTracks {
  items: TrackSummary[];
  fetchedAt: number;
}

export interface ArtistSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  url: string;
  genres: string[];
  followers: number;
}

export interface TopArtists {
  items: ArtistSummary[];
  fetchedAt: number;
}

export interface Queue {
  current: TrackSummary | null;
  next: TrackSummary[];
  fetchedAt: number;
}

export interface Profile {
  id: string;
  name: string;
  imageUrl: string | null;
  url: string;
  followers: number;
  fetchedAt: number;
}

export interface PlaylistSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  url: string;
  tracks: number;
}

export interface Playlists {
  items: PlaylistSummary[];
  fetchedAt: number;
}

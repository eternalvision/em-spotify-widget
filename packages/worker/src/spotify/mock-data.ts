import type {
  ArtistSummary,
  PlaylistSummary,
  Profile,
  Queue,
  Recent,
  TopArtists,
  TopTracks,
  TrackSummary,
} from '@em-spotify/shared/types';

const hues = [18, 200, 280, 140, 340, 50, 220, 160];

export const coverFor = (index: number): string => {
  const hue = hues[index % hues.length] ?? 18;
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 85% 55%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360} 80% 28%)"/></linearGradient></defs><rect width="300" height="300" fill="url(#g)"/><circle cx="150" cy="150" r="${50 + (index % 3) * 12}" fill="#00000033"/></svg>`,
  )}`;
};

const titles = [
  ['Neon Skyline', 'The Demo Band', 'Local Sessions'],
  ['Paper Moons', 'Lena Park', 'Quiet Hours'],
  ['Static Bloom', 'Hollow Kites', 'Garden State'],
  ['Night Courier', 'Mira Vale', 'After Rain'],
  ['Slow Orbit', 'North Arcade', 'Signal Fire'],
  ['Glass Harbor', 'Tom Ashby', 'Low Tide'],
  ['Velvet Static', 'The Demo Band', 'Local Sessions'],
  ['Open Roads', 'Lena Park', 'Quiet Hours'],
] as const;

export const mockTrack = (index: number): TrackSummary => {
  const [title, artist, album] = titles[index % titles.length] ?? titles[0];
  return {
    id: `mock-${index}`,
    title,
    artists: [artist],
    album,
    coverUrl: coverFor(index),
    thumbUrl: coverFor(index),
    url: 'https://open.spotify.com',
    durationMs: 180_000 + index * 7000,
  };
};

const tracks = (count: number, offset = 0): TrackSummary[] =>
  Array.from({ length: count }, (_, index) => mockTrack(index + offset));

export const mockRecent = (now: number): Recent => ({
  fetchedAt: now,
  items: tracks(12).map((track, index) => ({ track, playedAt: now - (index + 1) * 11 * 60_000 })),
});

export const mockTopTracks = (now: number): TopTracks => ({ fetchedAt: now, items: tracks(20) });

const artists: ArtistSummary[] = titles.map(([, name], index) => ({
  id: `mock-artist-${index}`,
  name: `${name}${index > 2 ? ` ${index}` : ''}`,
  imageUrl: coverFor(index + 3),
  url: 'https://open.spotify.com',
  genres: ['indie', 'electronic'].slice(0, 1 + (index % 2)),
  followers: 12_000 + index * 8_300,
}));

export const mockTopArtists = (now: number): TopArtists => ({ fetchedAt: now, items: artists });

export const mockQueue = (now: number): Queue => ({
  fetchedAt: now,
  current: mockTrack(0),
  next: tracks(10, 1),
});

export const mockProfile = (now: number): Profile => ({
  id: 'mock-user',
  name: 'Demo Listener',
  imageUrl: coverFor(5),
  url: 'https://open.spotify.com',
  followers: 128,
  fetchedAt: now,
});

const playlistNames = [
  'Late night drive',
  'Focus',
  'Sunday morning',
  'Gym',
  'Rainy day',
  'Road trip',
];

export const mockPlaylists = (now: number): { items: PlaylistSummary[]; fetchedAt: number } => ({
  fetchedAt: now,
  items: playlistNames.map((name, index) => ({
    id: `mock-playlist-${index}`,
    name,
    imageUrl: coverFor(index + 1),
    url: 'https://open.spotify.com',
    tracks: 18 + index * 9,
  })),
});

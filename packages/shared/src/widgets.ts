export const widgetNames = [
  'now-playing',
  'vinyl',
  'pill',
  'recent',
  'top-tracks',
  'top-artists',
  'queue',
  'playlists',
  'profile',
] as const;

export type WidgetName = (typeof widgetNames)[number];

export const widgetTags: Record<WidgetName, string> = {
  'now-playing': 'spotify-widget',
  vinyl: 'spotify-vinyl',
  pill: 'spotify-pill',
  recent: 'spotify-recent',
  'top-tracks': 'spotify-top-tracks',
  'top-artists': 'spotify-top-artists',
  queue: 'spotify-queue',
  playlists: 'spotify-playlists',
  profile: 'spotify-profile',
};

export const widgetTitles: Record<WidgetName, string> = {
  'now-playing': 'Now playing card',
  vinyl: 'Vinyl',
  pill: 'Compact pill',
  recent: 'Recently played',
  'top-tracks': 'Top tracks',
  'top-artists': 'Top artists',
  queue: 'Up next',
  playlists: 'Playlists',
  profile: 'Profile card',
};

export const widgetPaths: Record<WidgetName, string> = {
  'now-playing': '/api/now-playing',
  vinyl: '/api/now-playing',
  pill: '/api/now-playing',
  recent: '/api/recent',
  'top-tracks': '/api/top-tracks',
  'top-artists': '/api/top-artists',
  queue: '/api/queue',
  playlists: '/api/playlists',
  profile: '/api/profile',
};

export const widgetOf = (value: string | null): WidgetName =>
  widgetNames.find((name) => name === value) ?? 'now-playing';

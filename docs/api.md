# API

All paths are served by the Worker. Answers are JSON unless noted, every `/api/*` answer allows any origin (CORS), and only `GET` and `HEAD` are accepted (`405` otherwise). An unknown path answers `404 {"error":"not_found"}`; when Spotify cannot be reached the answer is `502 {"error":"unavailable"}`.

Times are milliseconds since the epoch (`fetchedAt`, `playedAt`) or milliseconds of music (`durationMs`, `progressMs`).

## Endpoints

| Path               | Query                              | Data                               | Cached for |
| ------------------ | ---------------------------------- | ---------------------------------- | ---------- |
| `/api/now-playing` |                                    | what plays now                     | 4 s        |
| `/api/recent`      |                                    | the last 20 played tracks          | 30 s       |
| `/api/top-tracks`  | `range=short`, `medium` or `long`  | up to 20 most played tracks        | 10 min     |
| `/api/top-artists` | `range=short`, `medium` or `long`  | up to 20 most played artists       | 10 min     |
| `/api/queue`       |                                    | the current track and what is next | 5 s        |
| `/api/profile`     |                                    | the account                        | 10 min     |
| `/api/playlists`   |                                    | up to 20 public playlists          | 10 min     |
| `/embed`           | `widget` and any option            | a page with one widget (HTML)      | 60 s       |
| `/card.svg`        | any option of the now playing card | the card as an image (SVG)         | 5 s        |

`range` is 4 weeks, 6 months or all time and defaults to `medium`. The widgets cut the lists to their `count`, so the Worker always asks Spotify for the maximum.

## Shapes

```ts
interface TrackSummary {
  id: string;
  title: string;
  artists: string[];
  album: string;
  coverUrl: string | null; // the largest cover
  thumbUrl: string | null; // the smallest cover, used for colors
  url: string;
  durationMs: number;
}

interface Track extends TrackSummary {
  progressMs: number;
}

// /api/now-playing
interface NowPlaying {
  state: 'playing' | 'paused' | 'idle';
  track: Track | null; // null when idle
  fetchedAt: number;
}

// /api/recent
interface Recent {
  items: { track: TrackSummary; playedAt: number }[];
  fetchedAt: number;
}

// /api/top-tracks
interface TopTracks {
  items: TrackSummary[];
  fetchedAt: number;
}

// /api/top-artists
interface TopArtists {
  items: {
    id: string;
    name: string;
    imageUrl: string | null;
    url: string;
    genres: string[];
    followers: number;
  }[];
  fetchedAt: number;
}

// /api/queue
interface Queue {
  current: TrackSummary | null;
  next: TrackSummary[];
  fetchedAt: number;
}

// /api/profile
interface Profile {
  id: string;
  name: string;
  imageUrl: string | null;
  url: string;
  followers: number;
  fetchedAt: number;
}

// /api/playlists (public playlists only)
interface Playlists {
  items: { id: string; name: string; imageUrl: string | null; url: string; tracks: number }[];
  fetchedAt: number;
}
```

The same types, with parsers that check a body before using it, live in `packages/shared` (`types.ts`, `parse.ts`).

## Notes

- **Episodes.** A podcast episode is shown like a track: the show is the artist and the publisher is the album.
- **Adverts.** Spotify sends no track while an advert plays, so the state is `idle`.
- **Progress.** A cached now playing answer is moved forward by its age before it is sent, so `progressMs` is right to within about a second.
- **Scopes.** The endpoints need `user-read-currently-playing`, `user-read-playback-state`, `user-read-recently-played`, `user-top-read`, `user-read-private` and `playlist-read-private`. Without a scope the matching endpoint answers `502`.
- **Mock mode.** With `MOCK=true` every `/api/*` endpoint answers with generated data and `/card.svg` draws it.

## `/embed`

`/embed?widget=<name>&<options>` returns a transparent page that loads `/widget.js` and shows one widget. `widget` is `now-playing` (the default), `vinyl`, `pill`, `recent`, `top-tracks`, `top-artists`, `queue`, `playlists` or `profile`. Only known options are copied to the element, and their values are escaped.

## `/card.svg`

Draws the now playing card. It takes the options of the card (`theme`, `layout`, `lang`, colors, `font`, `radius`, `width`, `padding`, `gap`, `hide`, `cover-colors`, `cover-blur`, `cover-bleed`); see the options table in the [README](../README.md). It does not poll, so an `<img>` shows the moment it was loaded, with the bars and the listening bar moving by themselves.

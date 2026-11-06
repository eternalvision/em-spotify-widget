import type { LanguageName } from '#shared/options.ts';

export interface Texts {
  playing: string;
  paused: string;
  idle: string;
}

export const texts: Record<LanguageName, Texts> = {
  en: { playing: 'Now playing on', paused: 'Paused on', idle: 'Not playing' },
  ru: { playing: 'Сейчас играет в', paused: 'На паузе в', idle: 'Ничего не играет' },
  uk: { playing: 'Зараз грає в', paused: 'На паузі в', idle: 'Нічого не грає' },
  cs: { playing: 'Právě hraje na', paused: 'Pozastaveno na', idle: 'Nic nehraje' },
};

export interface ListTexts {
  recent: string;
  topTracks: string;
  topArtists: string;
  queue: string;
  playlists: string;
  profile: string;
  followers: string;
  tracks: string;
  empty: string;
  unavailable: string;
  ranges: { short: string; medium: string; long: string };
}

export const listTexts: Record<LanguageName, ListTexts> = {
  en: {
    recent: 'Recently played',
    topTracks: 'Top tracks',
    topArtists: 'Top artists',
    queue: 'Up next',
    playlists: 'Playlists',
    profile: 'Spotify profile',
    followers: 'followers',
    tracks: 'tracks',
    empty: 'Nothing to show yet',
    unavailable: 'Spotify is not available',
    ranges: { short: 'Last 4 weeks', medium: 'Last 6 months', long: 'All time' },
  },
  ru: {
    recent: 'Недавно слушал',
    topTracks: 'Топ треков',
    topArtists: 'Топ исполнителей',
    queue: 'Дальше в очереди',
    playlists: 'Плейлисты',
    profile: 'Профиль Spotify',
    followers: 'подписчиков',
    tracks: 'треков',
    empty: 'Пока нечего показать',
    unavailable: 'Spotify недоступен',
    ranges: { short: 'Последние 4 недели', medium: 'Последние 6 месяцев', long: 'Всё время' },
  },
  uk: {
    recent: 'Нещодавно слухав',
    topTracks: 'Топ треків',
    topArtists: 'Топ виконавців',
    queue: 'Далі в черзі',
    playlists: 'Плейлисти',
    profile: 'Профіль Spotify',
    followers: 'підписників',
    tracks: 'треків',
    empty: 'Поки що нічого показати',
    unavailable: 'Spotify недоступний',
    ranges: { short: 'Останні 4 тижні', medium: 'Останні 6 місяців', long: 'Увесь час' },
  },
  cs: {
    recent: 'Nedávno přehráno',
    topTracks: 'Nejhranější skladby',
    topArtists: 'Nejhranější interpreti',
    queue: 'Příště hraje',
    playlists: 'Playlisty',
    profile: 'Profil Spotify',
    followers: 'sledujících',
    tracks: 'skladeb',
    empty: 'Zatím není co ukázat',
    unavailable: 'Spotify není dostupné',
    ranges: { short: 'Poslední 4 týdny', medium: 'Posledních 6 měsíců', long: 'Celá doba' },
  },
};

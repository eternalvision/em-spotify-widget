import type { AttributeName, HideablePart } from '@em-spotify/shared/options';
import type { WidgetName } from '@em-spotify/shared/widgets';

const base: readonly AttributeName[] = [
  'theme',
  'lang',
  'background',
  'color',
  'accent',
  'font',
  'radius',
  'width',
  'padding',
  'refresh',
  'link',
];

const lists: readonly AttributeName[] = [...base, 'hide'];

const attributesOf: Record<WidgetName, readonly AttributeName[]> = {
  'now-playing': [
    ...base,
    'layout',
    'bars',
    'progress',
    'cover-colors',
    'cover-blur',
    'cover-bleed',
    'gap',
    'hide',
  ],
  vinyl: [...base, 'cover-colors', 'gap', 'hide'],
  pill: [...base, 'bars', 'cover-colors', 'hide'],
  recent: [...lists, 'gap', 'count'],
  'top-tracks': [...lists, 'gap', 'count', 'range'],
  'top-artists': [...lists, 'gap', 'count', 'range'],
  queue: [...lists, 'gap', 'count'],
  playlists: [...lists, 'gap', 'count'],
  profile: lists,
};

const partsOf: Record<WidgetName, readonly HideablePart[]> = {
  'now-playing': ['cover', 'title', 'artist', 'album', 'progress', 'equalizer', 'logo', 'label'],
  vinyl: ['cover', 'title', 'artist', 'logo', 'label'],
  pill: ['cover', 'title', 'artist', 'equalizer', 'logo'],
  recent: ['heading', 'cover', 'artist', 'meta', 'logo'],
  'top-tracks': ['heading', 'cover', 'artist', 'meta', 'logo'],
  'top-artists': ['heading', 'cover', 'artist', 'meta', 'logo'],
  queue: ['heading', 'cover', 'artist', 'meta', 'logo'],
  playlists: ['heading', 'cover', 'meta', 'logo'],
  profile: ['cover', 'artist', 'logo'],
};

export const supports = (widget: WidgetName, name: AttributeName): boolean =>
  attributesOf[widget].includes(name);

export const partsFor = (widget: WidgetName): readonly HideablePart[] => partsOf[widget];

export const hasImage = (widget: WidgetName): boolean => widget === 'now-playing';

interface FrameShape {
  horizontal: boolean;
  bleed: boolean;
  count: number;
  width: number;
  padding: number;
  gap: number;
}

export const frameHeight = (widget: WidgetName, shape: FrameShape): number => {
  const { width, padding, gap } = shape;
  switch (widget) {
    case 'now-playing':
      if (shape.horizontal) {
        return padding * 2 + 168;
      }
      return width + gap + 172 + (shape.bleed ? padding : 0);
    case 'vinyl':
      return width + gap + 77;
    case 'pill':
      return 58;
    case 'profile':
      return padding * 2 + 78;
    case 'recent':
    case 'top-tracks':
    case 'top-artists':
    case 'queue':
    case 'playlists':
      return padding * 2 + gap + 20 + shape.count * 58;
  }
};

import { widgetTags } from '@em-spotify/shared/widgets';
import { configure, defineWidget } from 'ecmact';
import { buildCard } from '#widget/card/card.ts';
import { attributes, type Props } from '#widget/lib/props.ts';
import { buildList } from '#widget/lists/list.ts';
import { buildProfile } from '#widget/lists/profile.ts';
import {
  playlistsSpec,
  queueSpec,
  recentSpec,
  topArtistsSpec,
  topTracksSpec,
} from '#widget/lists/specs.ts';
import { buildPill } from '#widget/pill/pill.ts';
import { buildVinyl } from '#widget/vinyl/vinyl.ts';

configure({ styles: [':host { display: contents; }'] });

type Builder = (host: HTMLElement, props: Props) => Node;

const define = (tag: string, build: Builder): void => {
  defineWidget(tag, ({ host, props }) => build(host, props), { attributes });
};

define(widgetTags['now-playing'], buildCard);
define(widgetTags.vinyl, buildVinyl);
define(widgetTags.pill, buildPill);
define(widgetTags.recent, (host, props) => buildList(host, props, recentSpec));
define(widgetTags['top-tracks'], (host, props) => buildList(host, props, topTracksSpec));
define(widgetTags['top-artists'], (host, props) => buildList(host, props, topArtistsSpec));
define(widgetTags.queue, (host, props) => buildList(host, props, queueSpec));
define(widgetTags.playlists, (host, props) => buildList(host, props, playlistsSpec));
define(widgetTags.profile, buildProfile);

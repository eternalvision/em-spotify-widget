import { listTexts } from '@em-spotify/shared/texts';
import { computed, effect, ThemeProvider } from 'ecmact';
import { logoMarkup } from '#widget/card/logo.ts';
import { createCommon } from '#widget/lib/common.ts';
import { createLive } from '#widget/lib/live.ts';
import { endpointOf, type Props } from '#widget/lib/props.ts';
import {
  Body,
  Heading,
  HeadingText,
  Mark,
  Message,
  Meta,
  Panel,
  Rank,
  Row,
  Rows,
  Subheading,
  Text,
  Thumb,
  ThumbImage,
} from '#widget/lists/parts.ts';
import type { ListSpec, RowModel } from '#widget/lists/specs.ts';

export const buildList = <T>(host: HTMLElement, props: Props, spec: ListSpec<T>): Node => {
  const common = createCommon(host, props);
  const { options, theme } = common;
  const live = createLive(spec.parse, common.ready);
  const texts = computed(() => listTexts[options.value.lang]);
  const hidden = (part: 'heading' | 'cover' | 'artist' | 'meta' | 'logo') =>
    computed(() => options.value.hide.includes(part));
  const rows = computed(() => {
    const data = live.data.value;
    return data ? spec.rows(data, options.value).slice(0, options.value.count) : [];
  });
  const message = computed(() => {
    if (live.data.value === null) {
      return live.failed.value ? texts.value.unavailable : '';
    }
    return rows.value.length === 0 ? texts.value.empty : '';
  });
  const query = computed(() => new URLSearchParams(spec.query(options.value)).toString());
  const hideCover = hidden('cover');
  const hideArtist = hidden('artist');
  const hideMeta = hidden('meta');

  const rowOf = (model: RowModel) =>
    Row({
      key: model.key,
      'data-part': 'row',
      $linked: options.value.link,
      href: options.value.link ? model.url : '',
      target: '_blank',
      rel: 'noopener noreferrer',
      onclick: (event) => {
        if (!options.peek().link) {
          event.preventDefault();
        }
      },
      children: [
        Rank({
          'data-part': 'rank',
          $hidden: computed(() => hideMeta.value || model.rank === null),
          content: String(model.rank ?? ''),
        }),
        Thumb({
          'data-part': 'cover',
          $hidden: hideCover,
          $round: model.round,
          children: [ThumbImage({ alt: '', src: model.image ?? '' })],
        }),
        Body({
          children: [
            Text({ 'data-part': 'title', $strong: true, content: model.title }),
            Text({
              'data-part': 'subtitle',
              $tone: 'muted',
              $size: 13,
              $hidden: computed(() => hideArtist.value || model.subtitle === ''),
              content: model.subtitle,
            }),
          ],
        }),
        Meta({
          'data-part': 'meta',
          $hidden: computed(() => hideMeta.value || model.meta === ''),
          content: model.meta,
        }),
      ],
    });

  const panel = Panel({
    'data-part': 'panel',
    mounted: () => {
      const stopLive = effect(() => {
        const search = query.value;
        live.data.value = null;
        return live.start({
          endpoint: () => `${endpointOf(props.api.peek(), spec.path)}${search ? `?${search}` : ''}`,
          interval: () => options.peek().refresh,
        });
      });
      const stopHost = common.watchHost();
      return () => {
        stopLive();
        stopHost();
      };
    },
    children: [
      Heading({
        'data-part': 'heading',
        $hidden: hidden('heading'),
        children: [
          HeadingText({
            'data-part': 'heading-text',
            content: computed(() => spec.heading(texts.value)),
          }),
          Subheading({
            content: computed(() => spec.subheading(texts.value, options.value)),
          }),
          Mark({ 'data-part': 'logo', $hidden: hidden('logo'), html: logoMarkup }),
        ],
      }),
      Rows({
        'data-part': 'rows',
        mounted: (_, component) =>
          effect(() => {
            component.setState({ children: rows.value.map(rowOf) });
          }),
      }),
      Message({ 'data-part': 'message', content: message }),
    ],
  });

  return ThemeProvider({ theme, children: [panel] });
};

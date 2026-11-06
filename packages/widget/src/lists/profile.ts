import { listTexts } from '@em-spotify/shared/texts';
import { parseProfile } from '@em-spotify/shared/parse';
import { computed, styled, ThemeProvider } from 'ecmact';
import { logoMarkup } from '#widget/card/logo.ts';
import { createCommon } from '#widget/lib/common.ts';
import { createLive } from '#widget/lib/live.ts';
import { endpointOf, type Props } from '#widget/lib/props.ts';
import { Body, Mark, Message, Panel, Text, Thumb, ThumbImage } from '#widget/lists/parts.ts';

const Identity = styled.a<{ $linked?: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  color: inherit;
  text-decoration: none;
  cursor: ${(props) => (props.$linked ? 'pointer' : 'default')};
`;

const compact = new Intl.NumberFormat(undefined, { notation: 'compact' });

export const buildProfile = (host: HTMLElement, props: Props): Node => {
  const common = createCommon(host, props);
  const { options, theme } = common;
  const live = createLive(parseProfile, common.ready);
  const texts = computed(() => listTexts[options.value.lang]);
  const hidden = (part: 'cover' | 'artist' | 'logo') =>
    computed(() => options.value.hide.includes(part));
  const profile = live.data;
  const message = computed(() =>
    profile.value === null && live.failed.value ? texts.value.unavailable : '',
  );

  const panel = Panel({
    'data-part': 'panel',
    mounted: () => {
      const stopLive = live.start({
        endpoint: () => endpointOf(props.api.peek(), '/api/profile'),
        interval: () => options.peek().refresh,
      });
      const stopHost = common.watchHost();
      return () => {
        stopLive();
        stopHost();
      };
    },
    children: [
      Identity({
        'data-part': 'row',
        $linked: computed(() => options.value.link && profile.value !== null),
        href: computed(() => (options.value.link ? (profile.value?.url ?? '') : '')),
        target: '_blank',
        rel: 'noopener noreferrer',
        onclick: (event) => {
          if (!options.peek().link) {
            event.preventDefault();
          }
        },
        children: [
          Thumb({
            'data-part': 'cover',
            $hidden: hidden('cover'),
            $round: true,
            $size: 76,
            children: [ThumbImage({ alt: '', src: computed(() => profile.value?.imageUrl ?? '') })],
          }),
          Body({
            children: [
              Text({
                'data-part': 'title',
                $size: 22,
                $strong: true,
                content: computed(() => profile.value?.name ?? ''),
              }),
              Text({
                'data-part': 'subtitle',
                $tone: 'muted',
                $size: 14,
                $hidden: hidden('artist'),
                content: computed(() =>
                  profile.value
                    ? `${compact.format(profile.value.followers)} ${texts.value.followers}`
                    : '',
                ),
              }),
            ],
          }),
          Mark({ 'data-part': 'logo', $hidden: hidden('logo'), html: logoMarkup }),
        ],
      }),
      Message({ 'data-part': 'message', content: message }),
    ],
  });

  return ThemeProvider({ theme, children: [panel] });
};

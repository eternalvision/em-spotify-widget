import {
  type AttributeName,
  attributeNames,
  defaultOptions,
  hideableParts,
  languageNames,
  layoutNames,
  limits,
  parseOptions,
  rangeNames,
  themeNames,
} from '@em-spotify/shared/options';
import { resolvePalette } from '@em-spotify/shared/palette';
import { type WidgetName, widgetNames, widgetTags, widgetTitles } from '@em-spotify/shared/widgets';
import { computed, effect, mount, type ReadonlySignal, signal, tags } from 'ecmact';
import { Button } from '#widget/configurator/controls/button.ts';
import { ColorField } from '#widget/configurator/controls/color-field.ts';
import { Select } from '#widget/configurator/controls/select.ts';
import { Slider } from '#widget/configurator/controls/slider.ts';
import { Tabs } from '#widget/configurator/controls/tabs.ts';
import { TextBox } from '#widget/configurator/controls/text-box.ts';
import { Chip, Switch } from '#widget/configurator/controls/toggle.ts';
import {
  Canvas,
  Caption,
  Chips,
  Code,
  CodeCard,
  CodeHead,
  Header,
  Hint,
  Labeled,
  Lead,
  Only,
  Page,
  Pair,
  Pane,
  Panel,
  Rail,
  Shell,
  Stage,
  Title,
} from '#widget/configurator/parts.ts';
import {
  embedPath,
  iframeSnippet,
  imageSnippet,
  relevant,
  scriptSnippet,
  shapeOf,
  withQuery,
} from '#widget/configurator/snippets.ts';
import {
  flagOf,
  hiddenParts,
  numberOf,
  textOf,
  update,
  values,
  widget,
} from '#widget/configurator/state.ts';
import { frameHeight, hasImage, partsFor, supports } from '#widget/configurator/support.ts';

declare global {
  interface HTMLElementTagNameMap {
    'spotify-widget': HTMLElement;
    'spotify-vinyl': HTMLElement;
    'spotify-pill': HTMLElement;
    'spotify-recent': HTMLElement;
    'spotify-top-tracks': HTMLElement;
    'spotify-top-artists': HTMLElement;
    'spotify-queue': HTMLElement;
    'spotify-playlists': HTMLElement;
    'spotify-profile': HTMLElement;
  }
}

const origin = location.origin;

const themeColors = computed(() =>
  resolvePalette(
    parseOptions((name) => (name === 'theme' ? (values.value.theme ?? null) : null)),
    null,
  ),
);

const current = computed(() => relevant(widget.value, values.value));

const only = (name: AttributeName, node: Node) =>
  Only({ $hidden: computed(() => !supports(widget.value, name)), children: [node] });

const labeled = (label: string, control: Node) =>
  Labeled({ children: [Caption({ content: label }), control] });

const selectOf = (name: AttributeName, label: string, items: readonly string[], fallback: string) =>
  only(
    name,
    labeled(
      label,
      Select({
        label,
        items,
        value: textOf(name, fallback),
        onChange: (next) => {
          update(name, next, fallback);
        },
      }),
    ),
  );

const colorOf = (
  name: AttributeName,
  label: string,
  pick: (palette: ReturnType<typeof themeColors.peek>) => string,
) =>
  only(
    name,
    labeled(
      label,
      ColorField({
        label,
        fallback: computed(() => pick(themeColors.value).replace('#', '')),
        value: textOf(name),
        onChange: (next) => {
          update(name, next);
        },
      }),
    ),
  );

const sliderOf = (
  name: AttributeName,
  label: string,
  range: { min: number; max: number },
  fallback: number,
  step = 1,
) =>
  only(
    name,
    labeled(
      label,
      Slider({
        label,
        ...range,
        step,
        value: numberOf(name, fallback),
        onChange: (next) => {
          update(name, String(next), String(fallback));
        },
      }),
    ),
  );

const partChip = (part: (typeof hideableParts)[number]) =>
  Only({
    $hidden: computed(() => !partsFor(widget.value).includes(part)),
    children: [
      Chip({
        label: part,
        on: computed(() => !(values.value.hide ?? '').split(',').includes(part)),
        onToggle: () => {
          const rest = hiddenParts().filter((item) => item !== part);
          update('hide', (hiddenParts().includes(part) ? rest : [...rest, part]).join(','));
        },
      }),
    ],
  });

const switchOf = (name: AttributeName, label: string, fallback: boolean) =>
  only(
    name,
    Switch({
      label,
      on: flagOf(name, fallback),
      onToggle: () => {
        update(name, String(!flagOf(name, fallback).peek()), String(fallback));
      },
    }),
  );

const widgetItems = widgetNames.map((name) => widgetTitles[name]);

const widgetSelect = () =>
  labeled(
    'Widget',
    Select({
      label: 'Widget',
      items: widgetItems,
      value: computed(() => widgetTitles[widget.value]),
      onChange: (title) => {
        widget.value = widgetNames.find((name) => widgetTitles[name] === title) ?? 'now-playing';
      },
    }),
  );

const railTabs = [
  { id: 'look', label: 'Look' },
  { id: 'colors', label: 'Colors' },
  { id: 'size', label: 'Size' },
  { id: 'show', label: 'Show' },
] as const;

const rail = () => {
  const active = signal<string>('look');
  const panel = (id: string, children: Node[]) =>
    Panel({ $hidden: computed(() => active.value !== id), children });
  return Rail({
    children: [
      widgetSelect(),
      Tabs(railTabs, active),
      panel('look', [
        Pair({
          children: [
            selectOf('theme', 'Theme', themeNames, defaultOptions.theme),
            selectOf('layout', 'Layout', layoutNames, defaultOptions.layout),
          ],
        }),
        Pair({
          children: [
            selectOf('lang', 'Language', languageNames, defaultOptions.lang),
            selectOf('range', 'Period', rangeNames, defaultOptions.range),
          ],
        }),
        only(
          'font',
          labeled(
            'Font family',
            TextBox({
              label: 'Font family',
              placeholder: 'Georgia, serif',
              value: textOf('font'),
              onChange: (next) => {
                update('font', next.trim());
              },
            }),
          ),
        ),
      ]),
      panel('colors', [
        Pair({
          children: [
            colorOf('background', 'Background', (palette) => palette.background),
            colorOf('color', 'Text', (palette) => palette.text),
          ],
        }),
        Pair({
          children: [
            colorOf('accent', 'Accent', (palette) => palette.accent),
            colorOf('bars', 'Waveform', (palette) => palette.bars),
          ],
        }),
        colorOf('progress', 'Progress', (palette) => palette.progress),
        switchOf('cover-colors', 'Take colors from the cover', defaultOptions.coverColors),
      ]),
      panel('size', [
        sliderOf('radius', 'Corner radius', limits.radius, defaultOptions.radius),
        sliderOf('width', 'Width', limits.width, defaultOptions.width, 4),
        sliderOf('padding', 'Padding', limits.padding, defaultOptions.padding),
        sliderOf('gap', 'Space after the cover', limits.gap, defaultOptions.gap),
        sliderOf('count', 'Items', limits.count, defaultOptions.count),
        sliderOf('refresh', 'Refresh, seconds', limits.refresh, defaultOptions.refresh),
      ]),
      panel('show', [
        Chips({ children: hideableParts.map(partChip) }),
        switchOf('cover-blur', 'Blur the cover behind', defaultOptions.coverBlur),
        switchOf('cover-bleed', 'Cover to the edges', defaultOptions.coverBleed),
        switchOf('link', 'Link to the track', defaultOptions.link),
      ]),
    ],
  });
};

const attributesNow = () =>
  Object.fromEntries(attributeNames.map((name) => [name, computed(() => current.value[name])]));

const previewOf = (tag: keyof HTMLElementTagNameMap) =>
  tags[tag]({ shadow: false, ...attributesNow() });

const previewFor = (name: WidgetName) => previewOf(widgetTags[name] as keyof HTMLElementTagNameMap);

const widgetPane = () =>
  Pane({
    mounted: (_, component) =>
      effect(() => {
        component.setState({ children: [previewFor(widget.value)] });
      }),
  });

const iframePreview = () =>
  tags.iframe({
    shadow: false,
    title: 'Spotify',
    src: computed(() => embedPath(widget.value, current.value)),
    width: computed(() => current.value.width ?? String(defaultOptions.width)),
    height: computed(() => String(frameHeight(widget.value, shapeOf(current.value)))),
  });

const imagePreview = () =>
  tags.img({
    shadow: false,
    alt: 'Spotify',
    src: computed(() => (hasImage(widget.value) ? withQuery('/card.svg', current.value) : '')),
  });

const imageNote = 'The image is available for the Now playing card only.';

const tabs = [
  { id: 'widget', label: 'Script' },
  { id: 'iframe', label: 'Iframe' },
  { id: 'image', label: 'Image' },
] as const;

const stage = () => {
  const active = signal<string>('widget');
  const copied = signal(false);
  const snippet: ReadonlySignal<string> = computed(() => {
    const options = current.value;
    if (active.value === 'iframe') {
      return iframeSnippet(origin, widget.value, options);
    }
    if (active.value === 'image') {
      return hasImage(widget.value) ? imageSnippet(origin, options) : imageNote;
    }
    return scriptSnippet(origin, widget.value, options);
  });
  const hiddenUnless = (id: string) => computed(() => active.value !== id);
  const imageEmpty = computed(() => active.value === 'image' && !hasImage(widget.value));
  return Stage({
    children: [
      Tabs(tabs, active),
      Canvas({
        children: [
          Pane({ $hidden: hiddenUnless('widget'), children: [widgetPane()] }),
          Pane({ $hidden: hiddenUnless('iframe'), children: [iframePreview()] }),
          Pane({
            $hidden: hiddenUnless('image'),
            children: [
              Only({
                $hidden: computed(() => !hasImage(widget.value)),
                children: [imagePreview()],
              }),
              Only({
                $hidden: computed(() => hasImage(widget.value)),
                children: [Hint({ content: imageNote })],
              }),
            ],
          }),
        ],
      }),
      CodeCard({
        children: [
          CodeHead({
            children: [
              computed(() => tabs.find((tab) => tab.id === active.value)?.label ?? ''),
              Button(
                computed(() => (copied.value ? 'Copied' : 'Copy code')),
                () => {
                  if (imageEmpty.peek()) {
                    return;
                  }
                  void navigator.clipboard.writeText(snippet.peek());
                  copied.value = true;
                  setTimeout(() => {
                    copied.value = false;
                  }, 1600);
                },
              ),
            ],
          }),
          Code({ 'data-part': 'snippet', content: snippet }),
        ],
      }),
    ],
  });
};

export const mountConfigurator = (selector: string): void => {
  mount(
    selector,
    Page({
      children: [
        Shell({
          children: [
            Header({
              children: [
                Title({ content: 'Spotify widgets' }),
                Lead({ content: 'Pick a widget and a look, then copy the code for your site.' }),
              ],
            }),
            rail(),
            stage(),
          ],
        }),
      ],
    }),
  );
};

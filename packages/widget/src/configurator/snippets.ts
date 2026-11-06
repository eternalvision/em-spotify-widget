import type { AttributeName } from '@em-spotify/shared/options';
import { type WidgetName, widgetTags } from '@em-spotify/shared/widgets';
import { frameHeight, supports } from '#widget/configurator/support.ts';

export type Values = Partial<Record<AttributeName, string>>;

export const relevant = (widget: WidgetName, values: Values): Values =>
  Object.fromEntries(
    Object.entries(values).filter(([name]) => supports(widget, name as AttributeName)),
  );

export const attributesOf = (values: Values): string =>
  Object.entries(values)
    .map(([name, value]) => ` ${name}="${value}"`)
    .join('');

type Query = Partial<Record<string, string>>;

export const queryOf = (values: Query): string =>
  new URLSearchParams(
    Object.entries(values).flatMap(([name, value]) => (value === undefined ? [] : [[name, value]])),
  ).toString();

export const withQuery = (path: string, values: Query): string => {
  const query = queryOf(values);
  return query ? `${path}?${query}` : path;
};

export const embedPath = (widget: WidgetName, values: Values): string =>
  withQuery('/embed', widget === 'now-playing' ? values : { widget, ...values });

export const scriptSnippet = (origin: string, widget: WidgetName, values: Values): string => {
  const tag = widgetTags[widget];
  return `<script src="${origin}/widget.js"></script>\n<${tag}${attributesOf(values)}></${tag}>`;
};

export const shapeOf = (values: Values) => ({
  horizontal: values.layout === 'horizontal',
  bleed: values['cover-bleed'] === 'true',
  count: Number(values.count ?? 5),
  width: Number(values.width ?? 320),
  padding: Number(values.padding ?? 18),
  gap: Number(values.gap ?? 14),
});

export const iframeSnippet = (origin: string, widget: WidgetName, values: Values): string =>
  `<iframe src="${origin}${embedPath(widget, values)}" width="${values.width ?? '320'}" height="${frameHeight(widget, shapeOf(values))}" style="border:0" title="Spotify"></iframe>`;

export const imageSnippet = (origin: string, values: Values): string =>
  `<img src="${origin}${withQuery('/card.svg', values)}" alt="Spotify">`;

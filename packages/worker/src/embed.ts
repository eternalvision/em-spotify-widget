import { attributeNames } from '@em-spotify/shared/options';
import { widgetOf, widgetTags } from '@em-spotify/shared/widgets';
import { escapeXml } from '#worker/card/xml.ts';

export const embedPage = (params: URLSearchParams): string => {
  const tag = widgetTags[widgetOf(params.get('widget'))];
  const attributes = attributeNames
    .flatMap((name) => {
      const value = params.get(name);
      return value === null ? [] : [` ${name}="${escapeXml(value)}"`];
    })
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Spotify</title><style>html,body{margin:0;background:transparent}</style></head><body><${tag}${attributes}></${tag}><script src="/widget.js"></script></body></html>`;
};

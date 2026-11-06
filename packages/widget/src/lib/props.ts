import { type AttributeName, attributeNames } from '@em-spotify/shared/options';
import type { ReadonlySignal } from 'ecmact';

export const attributes = [...attributeNames, 'api'] as const;

export type Props = Record<AttributeName | 'api', ReadonlySignal<string | null>>;

const scriptOrigin = ((): string =>
  document.currentScript instanceof HTMLScriptElement && document.currentScript.src
    ? new URL(document.currentScript.src).origin
    : location.origin)();

export const endpointOf = (
  api: string | null,
  path: string,
  query: Record<string, string> = {},
): string => {
  const search = new URLSearchParams(query).toString();
  return `${(api ?? scriptOrigin).replace(/\/$/, '')}${path}${search ? `?${search}` : ''}`;
};

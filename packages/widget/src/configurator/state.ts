import type { AttributeName } from '@em-spotify/shared/options';
import type { WidgetName } from '@em-spotify/shared/widgets';
import { computed, type ReadonlySignal, signal } from 'ecmact';
import type { Values } from '#widget/configurator/snippets.ts';

export const values = signal<Values>({});
export const widget = signal<WidgetName>('now-playing');

export const resetValues = (): void => {
  values.value = {};
  widget.value = 'now-playing';
};

export const update = (name: AttributeName, value: string, fallback = ''): void => {
  const next = { ...values.peek() };
  if (value === '' || value === fallback) {
    Reflect.deleteProperty(next, name);
  } else {
    next[name] = value;
  }
  values.value = next;
};

export const textOf = (name: AttributeName, fallback = ''): ReadonlySignal<string> =>
  computed(() => values.value[name] ?? fallback);

export const numberOf = (name: AttributeName, fallback: number): ReadonlySignal<number> =>
  computed(() => Number(values.value[name] ?? fallback));

export const flagOf = (name: AttributeName, fallback: boolean): ReadonlySignal<boolean> =>
  computed(() => (values.value[name] ?? String(fallback)) === 'true');

export const hiddenParts = (): string[] => (values.peek().hide ?? '').split(',').filter(Boolean);

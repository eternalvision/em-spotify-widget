import { parseOptions } from '@em-spotify/shared/options';
import { resolvePalette } from '@em-spotify/shared/palette';
import { computed, effect, signal, untracked } from 'ecmact';
import type { Props } from '#widget/lib/props.ts';

export const systemFont =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

interface CommonConfig {
  radius?: (explicit: boolean, radius: number) => number;
}

export const createCommon = (host: HTMLElement, props: Props, config: CommonConfig = {}) => {
  const accent = signal<string | null>(null);
  const ready = signal(false);
  const options = computed(() => parseOptions((name) => props[name].value));
  const palette = computed(() => resolvePalette(options.value, accent.value));
  const theme = computed(() => ({
    ...palette.value,
    padding: options.value.padding,
    gap: options.value.gap,
    radius: config.radius
      ? config.radius(props.radius.value !== null, options.value.radius)
      : options.value.radius,
    font: options.value.font ?? systemFont,
  }));
  const applyHostStyle = (): void => {
    host.style.display = 'block';
    host.style.width = `${options.value.width}px`;
    host.style.maxWidth = '100%';
    host.style.opacity = ready.value ? '1' : '0';
    host.style.transition = 'opacity 180ms ease-out';
  };
  untracked(applyHostStyle);
  const watchHost = (): (() => void) => effect(applyHostStyle);
  return { accent, options, palette, ready, theme, watchHost };
};

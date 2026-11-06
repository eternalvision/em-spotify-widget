import { type Signal, signal } from 'ecmact';
import { startPolling } from '#widget/lib/poller.ts';

interface LiveConfig {
  endpoint: () => string;
  interval: () => number;
}

export const createLive = <T>(parse: (value: unknown) => T | null, ready: Signal<boolean>) => {
  const data = signal<T | null>(null);
  const failed = signal(false);
  const start = (config: LiveConfig): (() => void) =>
    startPolling({
      ...config,
      parse,
      onData: (next) => {
        data.value = next;
        failed.value = false;
        ready.value = true;
      },
      onError: () => {
        failed.value = true;
        ready.value = true;
      },
    });
  return { data, failed, start };
};

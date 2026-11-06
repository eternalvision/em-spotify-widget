import { createHttp } from 'ecmact';

interface PollingConfig<T> {
  endpoint: () => string;
  interval: () => number;
  parse: (value: unknown) => T | null;
  onData: (data: T) => void;
  onError?: () => void;
}

export const startPolling = <T>(config: PollingConfig<T>): (() => void) => {
  const client = createHttp({ timeout: 5000, retry: 1 });
  const state = { stopped: false, busy: false };
  const isStopped = (): boolean => state.stopped;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;

  const load = async (): Promise<void> => {
    controller = new AbortController();
    const response = await client.get(config.endpoint(), { signal: controller.signal });
    const data = config.parse(response.data);
    if (data === null) {
      throw new Error('unexpected response');
    }
    config.onData(data);
  };

  const tick = async (): Promise<void> => {
    if (state.stopped || state.busy) {
      return;
    }
    state.busy = true;
    if (!document.hidden) {
      await load().catch(() => {
        if (!isStopped()) {
          config.onError?.();
        }
      });
    }
    state.busy = false;
    if (!isStopped()) {
      timer = setTimeout(() => void tick(), config.interval() * 1000);
    }
  };

  const onVisible = (): void => {
    if (!document.hidden && !state.busy) {
      clearTimeout(timer);
      void tick();
    }
  };

  document.addEventListener('visibilitychange', onVisible);
  void tick();

  return () => {
    state.stopped = true;
    clearTimeout(timer);
    controller?.abort();
    document.removeEventListener('visibilitychange', onVisible);
  };
};

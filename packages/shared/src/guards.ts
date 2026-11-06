export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const textOf = (value: unknown): string | null =>
  typeof value === 'string' && value !== '' ? value : null;

export const numberOf = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export const listOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

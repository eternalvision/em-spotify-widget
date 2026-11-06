export const equalizerBars = 40;

export interface BarTiming {
  duration: number;
  delay: number;
  low: number;
  high: number;
}

const hashOf = (text: string): number => {
  let hash = 2166136261;
  for (const symbol of text) {
    hash = Math.imul(hash ^ (symbol.codePointAt(0) ?? 0), 16777619);
  }
  return hash >>> 0;
};

const unitOf = (seed: number, index: number): number => {
  const mixed = Math.imul(seed ^ Math.imul(index + 1, 0x9e3779b1), 0x85ebca6b) >>> 0;
  return (((mixed ^ (mixed >>> 13)) >>> 0) % 1000) / 1000;
};

export const barTimings = (seed: string, count: number): BarTiming[] => {
  const base = hashOf(seed);
  return Array.from({ length: count }, (_, index) => {
    const contour = 1 - 0.45 * (index / Math.max(1, count - 1));
    return {
      duration: 0.45 + unitOf(base, index) * 0.9,
      delay: -unitOf(base, index + 97) * 2,
      low: 0.08 + unitOf(base, index + 193) * 0.2,
      high: Math.min(1, (0.45 + unitOf(base, index + 389) * 0.55) * contour + 0.1),
    };
  });
};

import { describe, expect, it } from 'vitest';
import { barTimings, equalizerBars } from '#shared/equalizer.ts';

describe('barTimings', () => {
  it('gives every bar its own cycle that stays inside the bar', () => {
    const timings = barTimings('track', equalizerBars);
    expect(timings).toHaveLength(equalizerBars);
    timings.forEach((timing) => {
      expect(timing.high).toBeLessThanOrEqual(1);
      expect(timing.low).toBeGreaterThan(0);
      expect(timing.low).toBeLessThan(timing.high);
      expect(timing.duration).toBeGreaterThan(0);
    });
  });
});

describe('barTimings determinism', () => {
  it('is the same for the same track and differs between tracks', () => {
    expect(barTimings('a', 10)).toEqual(barTimings('a', 10));
    expect(barTimings('a', 10)).not.toEqual(barTimings('b', 10));
  });
});

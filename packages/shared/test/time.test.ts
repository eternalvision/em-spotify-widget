import { describe, expect, it } from 'vitest';
import { formatTime } from '#shared/time.ts';

describe('formatTime', () => {
  it('writes minutes and padded seconds', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65_900)).toBe('1:05');
    expect(formatTime(600_000)).toBe('10:00');
  });

  it('never goes below zero', () => {
    expect(formatTime(-5)).toBe('0:00');
  });
});

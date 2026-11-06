const toHex = (red: number, green: number, blue: number): string =>
  `#${[red, green, blue].map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`;

const lift = (red: number, green: number, blue: number): string => {
  const max = Math.max(red, green, blue) / 255;
  const min = Math.min(red, green, blue) / 255;
  const lightness = (max + min) / 2;
  const delta = max - min;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  const target = Math.min(0.65, Math.max(0.5, lightness));
  const boosted = Math.max(0.55, saturation);
  const chroma = (1 - Math.abs(2 * target - 1)) * boosted;
  const floor = target - chroma / 2;
  const hue = hueOf(red, green, blue);
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const sector = Math.floor(hue / 60) % 6;
  const [r, g, b] = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ][sector] ?? [0, 0, 0];
  return toHex((r + floor) * 255, (g + floor) * 255, (b + floor) * 255);
};

const hueOf = (red: number, green: number, blue: number): number => {
  const max = Math.max(red, green, blue);
  const delta = max - Math.min(red, green, blue);
  if (delta === 0) {
    return 0;
  }
  const raw =
    max === red
      ? (green - blue) / delta
      : max === green
        ? (blue - red) / delta + 2
        : (red - green) / delta + 4;
  return (raw * 60 + 360) % 360;
};

export const accentOfPixels = (pixels: ArrayLike<number>): string => {
  let red = 0;
  let green = 0;
  let blue = 0;
  let weight = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index] ?? 0;
    const g = pixels[index + 1] ?? 0;
    const b = pixels[index + 2] ?? 0;
    const spread = Math.max(r, g, b) - Math.min(r, g, b) + 1;
    red += r * spread;
    green += g * spread;
    blue += b * spread;
    weight += spread;
  }
  return lift(red / weight, green / weight, blue / weight);
};

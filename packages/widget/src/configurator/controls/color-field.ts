import { computed, type ReadonlySignal, signal, styled } from 'ecmact';
import { pressable, watchOutside } from '#widget/configurator/controls/press.ts';
import { TextBox } from '#widget/configurator/controls/text-box.ts';
import { tokens } from '#widget/configurator/controls/tokens.ts';

const presets = [
  '1db954',
  '1ed760',
  'ffffff',
  'b3b3b3',
  '535353',
  '121212',
  '000000',
  'ff5c5c',
  'ff9f1c',
  'ffd60a',
  '4cc9f0',
  '5b7cfa',
  'b86bff',
  'ff6bd6',
];

const Root = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Swatch = styled.div<{ $color?: string }>`
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${(props) => props.$color ?? 'transparent'};
  box-shadow: inset 0 0 0 1px ${tokens.lineStrong};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${tokens.green};
    outline-offset: 2px;
  }
`;

const Palette = styled.div<{ $open?: boolean }>`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 10;
  display: ${(props) => (props.$open ? 'grid' : 'none')};
  grid-template-columns: repeat(7, 24px);
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: ${tokens.raised};
  box-shadow:
    inset 0 0 0 1px ${tokens.lineStrong},
    0 18px 40px -12px rgba(0, 0, 0, 0.7);
`;

const Preset = styled.div<{ $color?: string; $on?: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${(props) => props.$color ?? 'transparent'};
  box-shadow: ${(props) =>
    props.$on
      ? `0 0 0 2px ${tokens.raised}, 0 0 0 4px ${tokens.text}`
      : `inset 0 0 0 1px ${tokens.lineStrong}`};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${tokens.green};
    outline-offset: 2px;
  }
`;

interface ColorFieldConfig {
  label: string;
  fallback: ReadonlySignal<string>;
  value: ReadonlySignal<string>;
  onChange: (value: string) => void;
}

const hexOf = (value: string): string | null => {
  const clean = value.trim().replace('#', '');
  return /^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean) ? clean.toLowerCase() : null;
};

export const ColorField = ({ label, fallback, value, onChange }: ColorFieldConfig) => {
  const open = signal(false);
  let root: HTMLElement | undefined;
  const current = computed(() => hexOf(value.value) ?? fallback.value);

  return Root({
    ref: (element) => {
      root = element;
    },
    mounted: () =>
      watchOutside(
        () => root,
        () => {
          open.value = false;
        },
      ),
    onkeydown: (event) => {
      if (event.key === 'Escape') {
        open.value = false;
      }
    },
    children: [
      Swatch({
        role: 'button',
        'aria-label': `${label} palette`,
        'aria-haspopup': 'true',
        'aria-expanded': computed(() => String(open.value)),
        $color: computed(() => `#${current.value}`),
        ...pressable(() => {
          open.value = !open.peek();
        }),
      }),
      TextBox({
        label,
        placeholder: fallback,
        value,
        onChange: (next) => {
          onChange(next.replace('#', ''));
        },
      }),
      Palette({
        role: 'group',
        'aria-label': `${label} presets`,
        $open: open,
        children: presets.map((preset) =>
          Preset({
            role: 'button',
            'aria-label': `#${preset}`,
            $color: `#${preset}`,
            $on: computed(() => current.value === preset),
            ...pressable(() => {
              onChange(preset);
              open.value = false;
            }),
          }),
        ),
      }),
    ],
  });
};

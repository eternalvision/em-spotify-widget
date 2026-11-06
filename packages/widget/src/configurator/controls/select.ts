import { computed, type ReadonlySignal, signal, styled } from 'ecmact';
import { pressable, watchOutside } from '#widget/configurator/controls/press.ts';
import { tokens } from '#widget/configurator/controls/tokens.ts';

const Root = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

const Trigger = styled.div<{ $open?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  box-sizing: border-box;
  min-height: 36px;
  padding: 8px 12px;
  border-radius: 10px;
  background: ${tokens.raised};
  box-shadow: inset 0 0 0 1px ${(props) => (props.$open ? tokens.green : tokens.line)};
  font-size: 14px;
  cursor: pointer;
  user-select: none;

  &:focus-visible {
    box-shadow: inset 0 0 0 1.5px ${tokens.green};
    outline: none;
  }
`;

const Chevron = styled.span<{ $open?: boolean }>`
  flex: none;
  width: 8px;
  height: 8px;
  margin-top: ${(props) => (props.$open ? '3px' : '-3px')};
  border-right: 1.5px solid ${tokens.muted};
  border-bottom: 1.5px solid ${tokens.muted};
  transform: rotate(${(props) => (props.$open ? '-135deg' : '45deg')});
  transition: transform 140ms;
`;

const Popup = styled.div<{ $open?: boolean }>`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  z-index: 10;
  display: ${(props) => (props.$open ? 'grid' : 'none')};
  gap: 2px;
  padding: 4px;
  border-radius: 12px;
  background: ${tokens.raised};
  box-shadow:
    inset 0 0 0 1px ${tokens.lineStrong},
    0 18px 40px -12px rgba(0, 0, 0, 0.7);
`;

const Option = styled.div<{ $active?: boolean; $selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  background: ${(props) => (props.$active ? tokens.lineStrong : 'transparent')};
  color: ${(props) => (props.$selected ? tokens.green : tokens.text)};
  font-size: 14px;
  cursor: pointer;
  user-select: none;
`;

interface SelectConfig {
  label: string;
  items: readonly string[];
  value: ReadonlySignal<string>;
  onChange: (value: string) => void;
}

export const Select = ({ label, items, value, onChange }: SelectConfig) => {
  const open = signal(false);
  const active = signal(0);
  let root: HTMLElement | undefined;

  const show = (): void => {
    active.value = Math.max(0, items.indexOf(value.peek()));
    open.value = true;
  };
  const choose = (item: string | undefined): void => {
    if (item !== undefined) {
      onChange(item);
    }
    open.value = false;
  };
  const move = (step: number): void => {
    active.value = (active.peek() + step + items.length) % items.length;
  };
  const confirm = (): void => {
    if (open.peek()) {
      choose(items.at(active.peek()));
    } else {
      show();
    }
  };
  const step = (amount: number): void => {
    if (open.peek()) {
      move(amount);
    } else {
      show();
    }
  };
  const keydown = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'ArrowDown':
        step(1);
        break;
      case 'ArrowUp':
        step(-1);
        break;
      case 'Home':
        active.value = 0;
        break;
      case 'End':
        active.value = items.length - 1;
        break;
      case 'Escape':
        open.value = false;
        break;
      case 'Enter':
      case ' ':
        confirm();
        break;
      default:
        return;
    }
    event.preventDefault();
  };

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
    children: [
      Trigger({
        role: 'combobox',
        'aria-label': label,
        'aria-haspopup': 'listbox',
        'aria-expanded': computed(() => String(open.value)),
        $open: open,
        tabindex: 0,
        onclick: () => {
          if (open.peek()) {
            open.value = false;
          } else {
            show();
          }
        },
        onkeydown: keydown,
        children: [value, Chevron({ $open: open })],
      }),
      Popup({
        role: 'listbox',
        $open: open,
        children: items.map((item) =>
          Option({
            role: 'option',
            'aria-selected': computed(() => String(value.value === item)),
            $selected: computed(() => value.value === item),
            $active: computed(() => open.value && items[active.value] === item),
            content: item,
            ...pressable(() => {
              choose(item);
            }),
          }),
        ),
      }),
    ],
  });
};

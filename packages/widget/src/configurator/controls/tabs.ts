import { computed, type ReadonlySignal, type Signal, styled } from 'ecmact';
import { tokens } from '#widget/configurator/controls/tokens.ts';

const List = styled.div`
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: 12px;
  background: ${tokens.raised};
`;

const Tab = styled.div<{ $on?: boolean }>`
  padding: 7px 16px;
  border-radius: 9px;
  background: ${(props) => (props.$on ? tokens.lineStrong : 'transparent')};
  color: ${(props) => (props.$on ? tokens.text : tokens.muted)};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: background 140ms;

  &:focus-visible {
    outline: 2px solid ${tokens.green};
    outline-offset: 1px;
  }
`;

interface TabItem {
  id: string;
  label: string;
}

export const Tabs = (items: readonly TabItem[], active: Signal<string>) => {
  const elements: HTMLElement[] = [];
  const select = (index: number): void => {
    const item = items.at(index);
    if (item) {
      active.value = item.id;
      elements.at(index)?.focus();
    }
  };
  return List({
    role: 'tablist',
    children: items.map((item, index) => {
      const on: ReadonlySignal<boolean> = computed(() => active.value === item.id);
      return Tab({
        role: 'tab',
        $on: on,
        content: item.label,
        tabindex: computed(() => (on.value ? 0 : -1)),
        'aria-selected': computed(() => String(on.value)),
        ref: (element) => {
          elements[index] = element;
        },
        onclick: () => {
          active.value = item.id;
        },
        onkeydown: (event) => {
          if (event.key === 'ArrowRight') {
            select((index + 1) % items.length);
          } else if (event.key === 'ArrowLeft') {
            select((index + items.length - 1) % items.length);
          }
        },
      });
    }),
  });
};

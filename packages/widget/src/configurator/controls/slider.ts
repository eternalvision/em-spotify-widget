import { computed, type ReadonlySignal, styled } from 'ecmact';
import { clamp, tokens } from '#widget/configurator/controls/tokens.ts';

const Track = styled.div`
  position: relative;
  flex: 1;
  height: 20px;
  cursor: pointer;
  touch-action: none;

  &::before {
    content: '';
    position: absolute;
    top: 8px;
    right: 0;
    left: 0;
    height: 4px;
    border-radius: 2px;
    background: ${tokens.lineStrong};
  }
`;

const Fill = styled.div`
  position: absolute;
  top: 8px;
  left: 0;
  height: 4px;
  border-radius: 2px;
  background: ${tokens.green};
`;

const Thumb = styled.div`
  position: absolute;
  top: 2px;
  width: 16px;
  height: 16px;
  margin-left: -8px;
  border-radius: 50%;
  background: ${tokens.text};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
  outline: none;

  &:focus-visible {
    box-shadow: 0 0 0 3px ${tokens.greenSoft};
    background: ${tokens.green};
  }
`;

const Output = styled.div`
  flex: none;
  min-width: 36px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: ${tokens.muted};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

interface SliderConfig {
  label: string;
  min: number;
  max: number;
  step: number;
  value: ReadonlySignal<number>;
  onChange: (value: number) => void;
}

export const Slider = ({ label, min, max, step, value, onChange }: SliderConfig) => {
  let track: HTMLElement | undefined;
  const dragging = { value: false };
  const percent = computed(() => `${((value.value - min) / (max - min)) * 100}%`);

  const set = (next: number): void => {
    onChange(clamp(Math.round(next / step) * step, min, max));
  };
  const fromPointer = (clientX: number): void => {
    if (!track) {
      return;
    }
    const box = track.getBoundingClientRect();
    set(min + clamp((clientX - box.left) / box.width, 0, 1) * (max - min));
  };
  const targetOf = (key: string): number | null => {
    switch (key) {
      case 'ArrowRight':
      case 'ArrowUp':
        return value.peek() + step;
      case 'ArrowLeft':
      case 'ArrowDown':
        return value.peek() - step;
      case 'PageUp':
        return value.peek() + (max - min) / 10;
      case 'PageDown':
        return value.peek() - (max - min) / 10;
      case 'Home':
        return min;
      case 'End':
        return max;
      default:
        return null;
    }
  };
  const keydown = (event: KeyboardEvent): void => {
    const target = targetOf(event.key);
    if (target !== null) {
      event.preventDefault();
      set(target);
    }
  };

  return Row({
    children: [
      Track({
        ref: (element) => {
          track = element;
        },
        onpointerdown: (event) => {
          dragging.value = true;
          track?.setPointerCapture(event.pointerId);
          fromPointer(event.clientX);
        },
        onpointermove: (event) => {
          if (dragging.value) {
            fromPointer(event.clientX);
          }
        },
        onpointerup: () => {
          dragging.value = false;
        },
        onpointercancel: () => {
          dragging.value = false;
        },
        children: [
          Fill({ style: { width: percent } }),
          Thumb({
            role: 'slider',
            tabindex: 0,
            'aria-label': label,
            'aria-valuemin': min,
            'aria-valuemax': max,
            'aria-valuenow': value,
            style: { left: percent },
            onkeydown: keydown,
          }),
        ],
      }),
      Output({ content: computed(() => String(value.value)) }),
    ],
  });
};

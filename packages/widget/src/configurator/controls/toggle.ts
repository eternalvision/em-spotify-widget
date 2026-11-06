import { computed, type ReadonlySignal, styled } from 'ecmact';
import { pressable } from '#widget/configurator/controls/press.ts';
import { tokens } from '#widget/configurator/controls/tokens.ts';

const SwitchRow = styled.div<{ $on?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  cursor: pointer;
  user-select: none;

  &:focus-visible {
    outline: 2px solid ${tokens.green};
    outline-offset: 4px;
    border-radius: 6px;
  }
`;

const Track = styled.span<{ $on?: boolean }>`
  position: relative;
  flex: none;
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: ${(props) => (props.$on ? tokens.green : tokens.lineStrong)};
  transition: background 140ms;
`;

const Knob = styled.span<{ $on?: boolean }>`
  position: absolute;
  top: 2px;
  left: ${(props) => (props.$on ? '18px' : '2px')};
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${(props) => (props.$on ? '#04140a' : tokens.text)};
  transition:
    left 140ms,
    background 140ms;
`;

const ChipBody = styled.div<{ $on?: boolean }>`
  padding: 6px 12px;
  border-radius: 999px;
  background: ${(props) => (props.$on ? tokens.greenSoft : 'transparent')};
  box-shadow: inset 0 0 0 1px ${(props) => (props.$on ? tokens.green : tokens.lineStrong)};
  color: ${(props) => (props.$on ? tokens.green : tokens.muted)};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition:
    background 140ms,
    color 140ms;

  &:focus-visible {
    outline: 2px solid ${tokens.text};
    outline-offset: 2px;
  }
`;

interface ToggleConfig {
  label: string;
  on: ReadonlySignal<boolean>;
  onToggle: () => void;
}

export const Switch = ({ label, on, onToggle }: ToggleConfig) =>
  SwitchRow({
    role: 'switch',
    'aria-checked': computed(() => String(on.value)),
    ...pressable(onToggle),
    children: [label, Track({ $on: on, children: [Knob({ $on: on })] })],
  });

export const Chip = ({ label, on, onToggle }: ToggleConfig) =>
  ChipBody({
    role: 'checkbox',
    'aria-checked': computed(() => String(on.value)),
    $on: on,
    content: label,
    ...pressable(onToggle),
  });

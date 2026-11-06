import { type ReadonlySignal, styled } from 'ecmact';
import { pressable } from '#widget/configurator/controls/press.ts';
import { tokens } from '#widget/configurator/controls/tokens.ts';

const Surface = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 7px 14px;
  border-radius: 999px;
  background: ${tokens.green};
  color: #04140a;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
  transition: filter 120ms;

  &:hover {
    filter: brightness(1.08);
  }

  &:active {
    filter: brightness(0.92);
  }

  &:focus-visible {
    outline: 2px solid ${tokens.text};
    outline-offset: 2px;
  }
`;

export const Button = (label: ReadonlySignal<string>, onPress: () => void) =>
  Surface({ role: 'button', ...pressable(onPress), content: label });

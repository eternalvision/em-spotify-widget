import { effect, type ReadonlySignal, styled } from 'ecmact';
import { tokens } from '#widget/configurator/controls/tokens.ts';

export const Editable = styled.div`
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  min-height: 36px;
  padding: 8px 12px;
  border-radius: 10px;
  background: ${tokens.raised};
  box-shadow: inset 0 0 0 1px ${tokens.line};
  color: ${tokens.text};
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
  overflow: hidden;
  outline: none;
  cursor: text;

  &:empty::before {
    content: attr(data-placeholder);
    color: ${tokens.dim};
  }

  &:focus {
    box-shadow: inset 0 0 0 1.5px ${tokens.green};
  }
`;

interface TextBoxConfig {
  label: string;
  placeholder: string | ReadonlySignal<string>;
  value: ReadonlySignal<string>;
  onChange: (value: string) => void;
}

export const TextBox = ({ label, placeholder, value, onChange }: TextBoxConfig) => {
  let editor: HTMLElement | undefined;
  return Editable({
    role: 'textbox',
    'aria-label': label,
    'data-placeholder': placeholder,
    contenteditable: 'plaintext-only',
    spellcheck: 'false',
    ref: (element) => {
      editor = element;
      element.textContent = value.peek();
    },
    mounted: () =>
      effect(() => {
        const next = value.value;
        if (editor && editor.textContent !== next) {
          editor.textContent = next;
        }
      }),
    oninput: () => {
      onChange(editor?.textContent ?? '');
    },
    onkeydown: (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
      }
    },
  });
};

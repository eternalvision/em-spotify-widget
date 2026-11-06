import { styled } from 'ecmact';
import { tokens } from '#widget/configurator/controls/tokens.ts';

export const Page = styled.div`
  position: fixed;
  inset: 0;
  overflow: auto;
  background: ${tokens.ink};
  color: ${tokens.text};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
`;

export const Shell = styled.div`
  display: grid;
  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
  gap: 20px 40px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 24px 32px;

  @media (max-width: 820px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Header = styled.div`
  grid-column: 1 / -1;
  display: grid;
  gap: 6px;
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 750;
  letter-spacing: -0.02em;
`;

export const Lead = styled.p`
  margin: 0;
  font-size: 15px;
  color: ${tokens.muted};
`;

export const Rail = styled.div`
  display: grid;
  gap: 18px;
  align-content: start;
`;

export const Panel = styled.div<{ $hidden?: boolean }>`
  display: ${(props) => (props.$hidden ? 'none' : 'grid')};
  gap: 14px;
`;

export const Pair = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
`;

export const Labeled = styled.div`
  display: grid;
  gap: 8px;
`;

export const Caption = styled.div`
  font-size: 13px;
  color: ${tokens.muted};
`;

export const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const Stage = styled.div`
  position: sticky;
  top: 24px;
  display: grid;
  gap: 16px;
  align-self: start;
  min-width: 0;

  @media (max-width: 820px) {
    position: static;
  }
`;

export const Canvas = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 340px;
  padding: 24px;
  border-radius: 20px;
  background:
    radial-gradient(${tokens.line} 1px, transparent 1px) 0 0 / 18px 18px,
    ${tokens.panel};
  box-shadow: inset 0 0 0 1px ${tokens.line};
  overflow: auto;
`;

export const Pane = styled.div<{ $hidden?: boolean }>`
  display: ${(props) => (props.$hidden ? 'none' : 'block')};
  max-width: 100%;

  iframe {
    display: block;
    border: 0;
  }

  img {
    display: block;
    max-width: 100%;
  }
`;

export const CodeCard = styled.div`
  display: grid;
  gap: 10px;
  padding: 12px 16px 14px;
  border-radius: 16px;
  background: ${tokens.panel};
  box-shadow: inset 0 0 0 1px ${tokens.line};
`;

export const CodeHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 650;
`;

export const Code = styled.div`
  font:
    12.5px/1.6 ui-monospace,
    SFMono-Regular,
    Menlo,
    Consolas,
    monospace;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: text;
`;

export const Only = styled.div<{ $hidden?: boolean }>`
  display: ${(props) => (props.$hidden ? 'none' : 'contents')};
`;

export const Hint = styled.div`
  max-width: 320px;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
  color: ${tokens.muted};
`;

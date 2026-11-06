import { styled } from 'ecmact';

interface Themed {
  theme: Record<string, unknown>;
}

const themed =
  (key: string) =>
  (props: Themed): string =>
    String(props.theme[key]);

const shown =
  (display: string) =>
  (props: { $hidden?: boolean }): string =>
    props.$hidden ? 'none' : display;

export const Panel = styled.div`
  display: grid;
  gap: ${themed('gap')}px;
  box-sizing: border-box;
  width: 100%;
  padding: ${themed('padding')}px;
  border-radius: var(--widget-radius, ${themed('radius')}px);
  background: var(--widget-bg, ${themed('background')});
  box-shadow: inset 0 0 0 1px ${themed('hairline')};
  color: var(--widget-text, ${themed('text')});
  font-family: var(--widget-font, ${themed('font')});
`;

export const Heading = styled.div<{ $hidden?: boolean }>`
  display: ${shown('flex')};
  align-items: center;
  gap: 10px;
  min-height: 20px;
`;

export const HeadingText = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 16px;
  font-weight: 750;
  letter-spacing: -0.01em;
`;

export const Subheading = styled.div`
  flex: none;
  font-size: 12px;
  color: ${themed('dim')};
`;

export const Mark = styled.span<{ $hidden?: boolean }>`
  display: ${shown('flex')};
  flex: none;

  svg {
    width: 18px;
    height: 18px;
    fill: var(--widget-accent, ${themed('accent')});
  }
`;

export const Rows = styled.div`
  display: grid;
  gap: 2px;
`;

export const Row = styled.a<{ $linked?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 -8px;
  padding: 6px 8px;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
  cursor: ${(props) => (props.$linked ? 'pointer' : 'default')};

  &:hover {
    background: ${(props) => (props.$linked ? themed('hairline')(props) : 'transparent')};
  }

  &:focus-visible {
    outline: 2px solid var(--widget-accent, ${themed('accent')});
    outline-offset: -2px;
  }
`;

export const Rank = styled.span<{ $hidden?: boolean }>`
  display: ${shown('block')};
  flex: none;
  width: 16px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  text-align: center;
  color: ${themed('dim')};
`;

export const Thumb = styled.div<{ $hidden?: boolean; $round?: boolean; $size?: number }>`
  display: ${shown('block')};
  flex: none;
  width: ${(props) => String(props.$size ?? 44)}px;
  height: ${(props) => String(props.$size ?? 44)}px;
  border-radius: ${(props) =>
    props.$round ? '50%' : `calc(var(--widget-radius, ${themed('radius')(props)}px) * 0.55)`};
  box-shadow: 0 0 0 1px ${themed('hairline')};
  background: ${themed('track')};
  overflow: hidden;
`;

export const ThumbImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const Text = styled.div<{
  $hidden?: boolean;
  $size?: number;
  $strong?: boolean;
  $tone?: 'muted' | 'dim';
}>`
  display: ${shown('block')};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: ${(props) => String(props.$size ?? 14)}px;
  font-weight: ${(props) => (props.$strong ? '650' : '450')};
  color: ${(props) => (props.$tone ? themed(props.$tone)(props) : 'inherit')};
`;

export const Meta = styled.span<{ $hidden?: boolean }>`
  display: ${shown('block')};
  flex: none;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: ${themed('dim')};
`;

export const Message = styled.div`
  padding: 18px 0;

  &:empty {
    display: none;
  }

  font-size: 14px;
  text-align: center;
  color: ${themed('dim')};
`;

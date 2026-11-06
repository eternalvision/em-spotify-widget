export const deepAll = (root: ParentNode, selector: string): HTMLElement[] => {
  const found = [...root.querySelectorAll<HTMLElement>(selector)];
  root.querySelectorAll('*').forEach((element) => {
    if (element.shadowRoot) {
      found.push(...deepAll(element.shadowRoot, selector));
    }
  });
  return found;
};

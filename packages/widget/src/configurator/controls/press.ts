export const pressable = (onPress: () => void) => ({
  tabindex: 0,
  onclick: () => {
    onPress();
  },
  onkeydown: (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPress();
    }
  },
});

export const watchOutside = (root: () => HTMLElement | undefined, onOutside: () => void) => {
  const listener = (event: Event): void => {
    const element = root();
    if (element && !event.composedPath().includes(element)) {
      onOutside();
    }
  };
  document.addEventListener('pointerdown', listener, true);
  return () => {
    document.removeEventListener('pointerdown', listener, true);
  };
};

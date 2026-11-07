const riseFrames: Keyframe[] = [
  { opacity: 0, transform: 'translateY(10px)' },
  { opacity: 1, transform: 'translateY(0)' },
];
const fadeFrames: Keyframe[] = [{ opacity: 1 }, { opacity: 0 }];
const ease = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
const riseMs = 520;
const stepMs = 55;
const fadeMs = 650;
const loadWaitMs = 1500;

const motionAllowed = (): boolean =>
  typeof matchMedia !== 'function' || !matchMedia('(prefers-reduced-motion: reduce)').matches;

const canAnimate = (element: HTMLElement): boolean => typeof element.animate === 'function';

export interface Swap {
  line: (element: HTMLElement) => void;
  cover: (element: HTMLElement) => void;
  backdrop: (element: HTMLElement) => void;
  run: () => void;
  stop: () => void;
}

export const createSwap = (): Swap => {
  const lines: HTMLElement[] = [];
  let backdrop: HTMLElement | undefined;
  let waiting = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const crossfade = (image: HTMLImageElement, previous: string): void => {
    const parent = image.parentNode;
    if (!parent || !previous || !canAnimate(image)) {
      return;
    }
    const ghost = new Image();
    ghost.src = previous;
    ghost.alt = '';
    ghost.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none';
    parent.appendChild(ghost);
    const animation = ghost.animate(fadeFrames, {
      duration: fadeMs,
      easing: ease,
      fill: 'forwards',
    });
    animation.onfinish = () => ghost.remove();
    animation.oncancel = () => ghost.remove();
  };

  return {
    line: (element) => {
      lines.push(element);
    },
    backdrop: (element) => {
      backdrop = element;
    },
    cover: (element) => {
      let shown = '';
      element.addEventListener('load', () => {
        const image = element as HTMLImageElement;
        const previous = shown;
        shown = image.currentSrc || image.src;
        if (waiting) {
          waiting = false;
          crossfade(image, previous);
        }
      });
    },
    run: () => {
      if (!motionAllowed()) {
        return;
      }
      lines.forEach((element, index) => {
        if (canAnimate(element)) {
          element.animate(riseFrames, {
            duration: riseMs,
            delay: index * stepMs,
            easing: ease,
            fill: 'backwards',
          });
        }
      });
      if (backdrop && canAnimate(backdrop)) {
        backdrop.animate([{ opacity: 0 }, { opacity: 0.6 }], { duration: fadeMs, easing: ease });
      }
      waiting = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        waiting = false;
      }, loadWaitMs);
    },
    stop: () => {
      clearTimeout(timer);
    },
  };
};

import { accentOfPixels } from '@em-spotify/shared/cover-color';
import { tags } from 'ecmact';

const size = 16;

export const coverAccent = (url: string): Promise<string | null> =>
  new Promise((resolve) => {
    let context: CanvasRenderingContext2D | null = null;
    tags.canvas({
      shadow: false,
      width: size,
      height: size,
      ref: (element) => {
        context = element.getContext('2d');
      },
    });
    const readPixels = (image: HTMLImageElement): void => {
      if (!context) {
        resolve(null);
        return;
      }
      try {
        context.drawImage(image, 0, 0, size, size);
        resolve(accentOfPixels(context.getImageData(0, 0, size, size).data));
      } catch {
        resolve(null);
      }
    };
    tags.img({
      shadow: false,
      crossorigin: 'anonymous',
      src: url,
      onerror: () => {
        resolve(null);
      },
      onload: (event) => {
        if (event.target instanceof HTMLImageElement) {
          readPixels(event.target);
        }
      },
    });
  });

export interface ColorPalette {
  dominant: string; // e.g. "rgb(230, 45, 90)"
  ambientGradient: string; // CSS background string for blurred glow
  textContrast: 'light' | 'dark';
}

const colorCache = new Map<string, ColorPalette>();

const DEFAULT_PALETTE: ColorPalette = {
  dominant: 'rgb(244, 63, 94)',
  ambientGradient: 'radial-gradient(circle, rgba(244,63,94,0.3) 0%, rgba(15,23,42,0.95) 100%)',
  textContrast: 'light',
};

export async function extractDominantColor(imageUrl?: string): Promise<ColorPalette> {
  if (!imageUrl) return DEFAULT_PALETTE;
  if (colorCache.has(imageUrl)) return colorCache.get(imageUrl)!;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        canvas.width = 40;
        canvas.height = 40;
        ctx.drawImage(img, 0, 0, 40, 40);

        const imgData = ctx.getImageData(0, 0, 40, 40).data;
        let rSum = 0,
          gSum = 0,
          bSum = 0,
          count = 0;

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Filter out near-white or near-black pixels for richer saturation
          if (a > 128) {
            const brightness = (r + g + b) / 3;
            if (brightness > 20 && brightness < 235) {
              rSum += r;
              gSum += g;
              bSum += b;
              count++;
            }
          }
        }

        if (count === 0) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        const rAvg = Math.round(rSum / count);
        const gAvg = Math.round(gSum / count);
        const bAvg = Math.round(bSum / count);

        const dominant = `rgb(${rAvg}, ${gAvg}, ${bAvg})`;
        const ambientGradient = `radial-gradient(ellipse at top center, rgba(${rAvg},${gAvg},${bAvg},0.45) 0%, rgba(15,23,42,0.95) 75%)`;

        const palette: ColorPalette = {
          dominant,
          ambientGradient,
          textContrast: (rAvg * 299 + gAvg * 587 + bAvg * 114) / 1000 > 160 ? 'dark' : 'light',
        };

        colorCache.set(imageUrl, palette);
        resolve(palette);
      } catch (_err) {
        resolve(DEFAULT_PALETTE);
      }
    };

    img.onerror = () => resolve(DEFAULT_PALETTE);
    img.src = imageUrl;
  });
}

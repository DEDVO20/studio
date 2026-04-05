'use client';

type PdfImageFormat = 'PNG' | 'JPEG';

export type PdfImageSource = {
  dataUrl: string;
  format: PdfImageFormat;
};

function getMimeTypeFromDataUrl(value: string): string | null {
  const match = value.match(/^data:([^;,]+)[;,]/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function getImageFormatFromMimeType(mimeType: string | null): PdfImageFormat | null {
  if (mimeType === 'image/png') {
    return 'PNG';
  }

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return 'JPEG';
  }

  return null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No se pudo cargar la imagen para el PDF: ${src}`));
    image.src = src;
  });
}

export async function getPdfCompatibleImage(imageSource: string): Promise<PdfImageSource> {
  const directFormat = getImageFormatFromMimeType(getMimeTypeFromDataUrl(imageSource));
  if (directFormat) {
    return {
      dataUrl: imageSource,
      format: directFormat,
    };
  }

  const image = await loadImage(imageSource);
  const canvas = document.createElement('canvas');
  const width = image.naturalWidth || image.width || 100;
  const height = image.naturalHeight || image.height || 100;

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No se pudo preparar el logo para el PDF.');
  }

  context.drawImage(image, 0, 0, width, height);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    format: 'PNG',
  };
}

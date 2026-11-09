const MAX_SIDE = 256

/** Downsizes to a 256px JPEG so the photo is small enough to be stored with the account. */
export function shrink(dataUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(dataUrl)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

/** Reads a picked file as a data URL (null when it is not an image). */
export function readImageFile(file: File): Promise<string | null> {
  return new Promise(resolve => {
    if (!file.type.startsWith('image/')) return resolve(null)
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

/** Region of the source image kept by the crop, as fractions (0–1) of its width/height. */
export interface CropRegion { x: number; y: number; w: number; h: number }

/** Draws `region` of `img` into a JPEG of `width` px with the given aspect ratio (width / height). */
export function cropToDataUrl(img: HTMLImageElement, region: CropRegion, width: number, aspect: number, quality = 0.85): string {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(width / aspect))
  const ctx = canvas.getContext('2d')
  if (!ctx) return img.src
  const nw = img.naturalWidth, nh = img.naturalHeight
  ctx.drawImage(img, region.x * nw, region.y * nh, region.w * nw, region.h * nh, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

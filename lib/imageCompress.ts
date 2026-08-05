// Redimensiona y comprime una imagen en el navegador antes de subirla,
// para evitar mandar fotos de varios MB directo desde el celular.
export async function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) return file

    // Si la compresión no ayuda (imagen ya chica/liviana), mantenemos el original
    if (blob.size >= file.size) return file

    const newName = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch (err) {
    console.warn('No se pudo comprimir la imagen, se sube el original:', err)
    return file
  }
}

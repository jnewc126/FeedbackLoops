// Vercel rejects request bodies over 4.5 MB, so photos are shrunk in the browser before upload.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const PASSTHROUGH_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Returns the file untouched when it's already small and in a common format,
// otherwise a JPEG copy whose longest edge is at most maxEdge pixels.
export async function prepareImage(file: File, {maxEdge = 2048, passthroughBytes = MAX_UPLOAD_BYTES} = {}): Promise<File> {
    if (PASSTHROUGH_TYPES.includes(file.type) && file.size <= passthroughBytes) return file;
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        throw new Error('This photo format isn’t supported here. Try a JPG or PNG.');
    }
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob || blob.size > MAX_UPLOAD_BYTES) {
        throw new Error('This photo is too large to upload. Try a smaller one.');
    }
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {type: 'image/jpeg'});
}

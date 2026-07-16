export const MAX_IMAGE_SIZE_MB = 10;

/**
 * Downscales and re-encodes an image on the client before upload so large
 * phone photos don't upload raw over slow connections.
 * Returns the original file if compression fails or wouldn't help.
 * @param {File} file
 * @param {{ maxDimension?: number, quality?: number }} options
 * @returns {Promise<File>}
 */
export async function compressImage(file, { maxDimension = 1280, quality = 0.8 } = {}) {
  // GIFs would lose animation; small files aren't worth re-encoding
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < 300 * 1024) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to decode image"));
      image.src = objectUrl;
    });

    let { width, height } = img;
    const largestSide = Math.max(width, height);
    if (largestSide > maxDimension) {
      const scale = maxDimension / largestSide;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Optimizes a Cloudinary image URL by injecting transformation parameters.
 * If the URL is not a valid Cloudinary URL, it returns the original URL.
 * 
 * @param {string} url - The original image URL.
 * @param {number} width - The desired width constraint.
 * @returns {string} The optimized image URL.
 */
export const optimizeImage = (url, width) => {
  if (!url) return '';
  if (typeof url !== 'string') return url;

  // Only transform Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }

  // Check if it already has transformations, to avoid double injecting.
  // Actually, a simpler way is to split by /upload/ and insert our parameters.
  // We'll use c_limit to only scale down images larger than the width, avoiding upscaling.
  const transformations = `f_auto,q_auto,c_limit,w_${width}`;

  // If the URL already contains /upload/ followed by a version or file
  if (url.includes('/upload/')) {
    // If it already contains our exact transformation string or similar, don't inject again
    if (url.includes('f_auto') && url.includes('q_auto')) {
      return url;
    }

    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/${transformations}/${parts[1]}`;
    }
  }

  return url;
};

export const getImageUrl = (imagePath, fallback = null) => {
    if (!imagePath) return fallback;
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
    // Use relative path: Vite proxy (dev) and Vercel rewrites (prod) handle routing
    return `/uploads/${imagePath}`;
};

export default getImageUrl;

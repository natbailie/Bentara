/**
 * Global Configuration Utility
 * Ensures the app only uses production environment variables.
 */
export const getBaseUrl = (): string => {
    // Accesses the NEXT_PUBLIC variable defined in Vercel
    const url = process.env.NEXT_PUBLIC_API_URL;

    if (!url) {
        // This will alert you in the browser console if Vercel isn't configured right
        console.error("ENVIRONMENT ERROR: NEXT_PUBLIC_API_URL is missing.");
        return "";
    }

    // Normalizes the URL string
    return url.endsWith('/') ? url.slice(0, -1) : url;
};
/**
 * Resolves relative API paths to absolute paths under custom domains
 * to keep the background full-stack integrations (Firestore, Gemini, Asaas) 100% functional.
 */
export function getApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const hostname = window.location.hostname;
  
  // If running in development local host or inside the Cloud Run preview domain natively, relative routing is perfectly fine
  if (
    hostname === "localhost" || 
    hostname === "127.0.0.1" || 
    hostname.includes("ais-dev-") ||
    hostname.includes("ais-pre-") ||
    hostname.includes("run.app")
  ) {
    return cleanPath;
  }
  
  // Custom Domain fallback (e.g. prospect.adshive.online) - route API requests to the real production backend
  return `https://ais-pre-ngxruki73rlyomvbcmwvoz-502327203387.us-west2.run.app${cleanPath}`;
}

/**
 * Audit log helper that prints detailed response logs without disrupting the body stream.
 */
export async function logResponseDebug(response: Response) {
  try {
    const cloned = response.clone();
    console.log("[API AUDIT LOG] HTTP Status:", response.status);
    console.log("[API AUDIT LOG] URL:", response.url);
    console.log("[API AUDIT LOG] Content-Type:", response.headers.get('content-type'));
    const textBody = await cloned.text();
    console.log("[API AUDIT LOG] Raw body response length:", textBody.length);
    console.log("[API AUDIT LOG] Response body:", textBody);
  } catch (err) {
    console.warn("[API AUDIT LOG ERROR] Failed to serialize debug log details", err);
  }
}

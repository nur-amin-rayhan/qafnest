declare global {
  interface Window {
    google?: any;
  }
}

let loadPromise: Promise<any> | null = null;

export function getGoogleMapsApiKey(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();
}

/**
 * Loads the Google Maps JavaScript API via standard script injection.
 * Reuses existing script/instance if already loaded.
 */
export function loadGoogleMapsScript(language: "ar" | "en" = "ar"): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available"));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || apiKey === "YOUR_API_KEY" || apiKey === "AIzaSy...") {
    return Promise.reject(new Error("Google Maps API key not configured"));
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        existingScript.addEventListener("load", () => resolve(window.google?.maps));
        existingScript.addEventListener("error", (err) => reject(err));
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.type = "text/javascript";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places,geometry&language=${language}&region=SA`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps API loaded but window.google.maps is undefined"));
      }
    };

    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Google Maps script"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

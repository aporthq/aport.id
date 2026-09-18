/**
 * Environment configuration for aport.id
 * Handles both client-side and server-side environment variables safely
 */

const getEnv = (key: string, defaultValue: string = ""): string => {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

export function getClientConfig() {
  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return getEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  };

  const getApiBaseUrl = () => {
    const apiBaseUrl = getEnv("NEXT_PUBLIC_API_BASE_URL");
    if (apiBaseUrl) return apiBaseUrl;

    if (typeof window !== "undefined") {
      const isLocalDev =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (isLocalDev) return "http://localhost:8789";
    }

    return typeof window !== "undefined" ? window.location.origin : "";
  };

  const getAportDomain = () => {
    const configured = getEnv("NEXT_PUBLIC_APORT_BASE_URL");
    if (configured) return configured;

    // This is a static export, so the env var is baked in at build time and a
    // build without it shipped localhost to production: the widget and VC
    // iframes on the passport page pointed at a machine the visitor does not
    // have. Fall back to localhost only when actually running on localhost,
    // matching getApiBaseUrl above, and to production everywhere else.
    if (typeof window !== "undefined") {
      const isLocalDev =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (isLocalDev) return "http://localhost:8787";
    }

    return "https://aport.io";
  };

  return {
    app: {
      baseUrl: getBaseUrl(),
      apiBaseUrl: getApiBaseUrl(),
      aportDomain: getAportDomain(),
      env: getEnvironment(),
    },
  };
}

export function getEnvironment(): "development" | "production" | "test" {
  return (
    (getEnv("NODE_ENV") as "development" | "production" | "test") ||
    "development"
  );
}

export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

export function isProduction(): boolean {
  return getEnvironment() === "production";
}

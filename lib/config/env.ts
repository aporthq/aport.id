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
      if (isLocalDev) return "http://localhost:8787";
    }

    return typeof window !== "undefined" ? window.location.origin : "";
  };

  return {
    app: {
      baseUrl: getBaseUrl(),
      apiBaseUrl: getApiBaseUrl(),
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

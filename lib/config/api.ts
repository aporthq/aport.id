import { getClientConfig } from "./env";

const config = getClientConfig();
const API_BASE_URL = config.app.apiBaseUrl;

/**
 * API configuration for aport.id
 */
export const apiConfig = {
  baseUrl: API_BASE_URL,
  appBaseUrl: config.app.baseUrl,

  endpoints: {
    // Health
    health: `${API_BASE_URL}/api/health`,

    // Passport issuance
    issue: `${API_BASE_URL}/api/issue`,

    // Passport retrieval (proxied from APort API)
    passport: (agentId: string) => `${API_BASE_URL}/api/passport/${agentId}`,

    // Gallery
    gallery: `${API_BASE_URL}/api/gallery`,
  },
};

export default apiConfig;

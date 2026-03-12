/**
 * Cloudflare Pages Function environment bindings
 */
export interface AppEnv {
  // KV namespace for gallery index
  KV: KVNamespace;

  // APort API
  APORT_BASE_URL: string;
  APORT_API_KEY: string;
  APORT_ORG_ID: string;
  APORT_ASSURANCE_TYPE: string;
  APORT_ASSURANCE_LEVEL: string;
  AGENT_PASSPORT_BASE_URL: string;

  // App
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: string;
}

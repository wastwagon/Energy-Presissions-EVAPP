/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  /** Optional: full https URL to host Privacy Policy off-app (Apple / store listings). */
  readonly VITE_PRIVACY_POLICY_URL?: string;
  /** Optional: full https URL to host Terms off-app. */
  readonly VITE_TERMS_OF_SERVICE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}




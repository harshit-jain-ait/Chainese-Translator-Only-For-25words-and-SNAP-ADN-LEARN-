/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional base URL pointing to the deployed backend service (e.g. on Render or Railway).
   * When empty or unset, relative URLs (/api/...) are used, which work with the Vite local proxy.
   */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


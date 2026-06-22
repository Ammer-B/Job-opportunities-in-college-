/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAPIDAPI_KEY: string;
  readonly VITE_JOOBLE_KEY: string | undefined;
  readonly VITE_ADZUNA_APP_ID: string | undefined;
  readonly VITE_ADZUNA_APP_KEY: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

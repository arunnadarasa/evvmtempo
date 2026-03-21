/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Add VITE_* keys here if the app reads new env vars.
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

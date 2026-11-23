
/// <reference types="vite/client" />
// Declare client-visible build variables here so Vite configuration stays typed across consumers.

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

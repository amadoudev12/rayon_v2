/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Adresse du backend quand il n'est pas servi sur la même origine que le site. */
  readonly VITE_API_URL?: string;
}

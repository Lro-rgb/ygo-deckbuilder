/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Basis-URL der Kartenbilder. Leer heisst: aus dem eigenen public/cards/.
   * Beim Deployment zeigt sie dorthin, wo die Bilder einmalig abgelegt wurden.
   */
  readonly VITE_CARD_IMAGES?: string
}

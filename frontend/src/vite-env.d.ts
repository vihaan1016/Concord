/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_RPC_URL?: string
  readonly VITE_DEX_ADDRESS?: string
  readonly VITE_BASE_TOKEN?: string
  readonly VITE_QUOTE_TOKEN?: string
  readonly VITE_RELAYER_URL?: string
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

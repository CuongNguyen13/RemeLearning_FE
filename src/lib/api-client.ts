import { createHttpClient } from "@/lib/http"

// bff-service (8080) - the single entry point for every call except the one documented
// exception in user-service-client.ts.
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api"

export const apiClient = createHttpClient(apiBaseUrl)

import { createHttpClient } from "@/lib/http"

// bff-service (8080) - the single entry point for every call except the one documented
// exception in user-service-client.ts.
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api"

export const apiClient = createHttpClient(apiBaseUrl)

// Same auth interceptor as apiClient but with no baseURL prefix, for callers that already hold a
// full path (e.g. dictationClipAudioUrl) so it isn't prepended with apiBaseUrl a second time.
export const rawApiClient = createHttpClient("")

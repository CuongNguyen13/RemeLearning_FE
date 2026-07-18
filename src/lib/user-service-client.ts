import { createHttpClient } from "@/lib/http"

// bff-service does not proxy POST /api/v1/users/{userId}/photo (see docs/API.md section 6 vs
// user-service's section 2) - this is the one documented call that bypasses the BFF and hits
// user-service directly.
export const userServiceClient = createHttpClient(
  import.meta.env.VITE_USER_SERVICE_URL ?? "http://localhost:8081"
)

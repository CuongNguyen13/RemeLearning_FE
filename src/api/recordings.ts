import { apiClient } from "@/lib/api-client"
import { unwrap } from "@/lib/http"
import type { ApiResponse, Recording } from "@/types/api"

export interface UploadRecordingInput {
  file: File
  userId: string
  languageCode?: string
}

// POST /api/v1/recordings - multipart upload, streamed straight through to recording-service.
export async function uploadRecording({
  file,
  userId,
  languageCode,
}: UploadRecordingInput): Promise<Recording> {
  const form = new FormData()
  form.append("file", file)
  form.append("userId", userId)
  if (languageCode) {
    form.append("languageCode", languageCode)
  }
  const { data } = await apiClient.post<ApiResponse<Recording>>("/recordings", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return unwrap(data)
}

import type { PhotoResponse, VideoJobResponse, VideoStatusResponse } from "./types"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.combariza.com"

async function post<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "POST", body })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text)
  }
  return res.json() as Promise<T>
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(res.statusText)
  return res.json() as Promise<T>
}

export async function detectPhoto(file: File, expectedCount?: number): Promise<PhotoResponse> {
  const fd = new FormData()
  fd.append("file", file)
  if (expectedCount) fd.append("expected_tags", String(expectedCount))
  return post<PhotoResponse>("/api/v1/detect/photo", fd)
}

export async function startVideoDetection(file: File): Promise<VideoJobResponse> {
  const fd = new FormData()
  fd.append("file", file)
  return post<VideoJobResponse>("/api/v1/detect/video", fd)
}

export async function getVideoStatus(jobId: string): Promise<VideoStatusResponse> {
  return get<VideoStatusResponse>(`/api/v1/detect/video/${jobId}`)
}

import type { CajasPhotoResponse, PhotoResponse, VideoJobResponse, VideoStatusResponse } from "./types"

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

export async function detectPhoto(file: File, expectedCount?: number, family = "tagStandard52h13"): Promise<PhotoResponse> {
  const fd = new FormData()
  fd.append("file", file)
  if (expectedCount) fd.append("expected_tags", String(expectedCount))
  const qs = `?tag_family=${encodeURIComponent(family)}`
  return post<PhotoResponse>(`/api/v1/detect/photo${qs}`, fd)
}

export async function startVideoDetection(file: File, family = "tagStandard52h13"): Promise<VideoJobResponse> {
  const fd = new FormData()
  fd.append("file", file)
  const qs = `?tag_family=${encodeURIComponent(family)}`
  return post<VideoJobResponse>(`/api/v1/detect/video${qs}`, fd)
}

export async function getVideoStatus(jobId: string): Promise<VideoStatusResponse> {
  return get<VideoStatusResponse>(`/api/v1/detect/video/${jobId}`)
}

export async function detectCajasPhoto(file: File): Promise<CajasPhotoResponse> {
  const fd = new FormData()
  fd.append("file", file)
  return post<CajasPhotoResponse>("/api/v1/cajas/photo", fd)
}

export interface DetectionResult {
  tag_id: number
  confidence: number
  label: string
}

export interface PhotoResponse {
  detections: DetectionResult[]
  annotated_image: string
}

export interface VideoJobResponse {
  job_id: string
}

export interface VideoStatusResponse {
  status: "processing" | "done" | "error"
  progress: number
  detections: DetectionResult[] | null
  error: string | null
}

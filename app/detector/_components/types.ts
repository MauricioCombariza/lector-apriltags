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

export interface CajasPhotoResponse {
  detected_lateral: number
  pallet_detected: boolean
  annotated_image: string // base64 JPEG
}

export interface CajasPhotoEntry {
  id: string
  annotated_image: string
  detected: number
  pallet_detected: boolean
  to_add: number
  to_subtract: number
}

"use client"

import { useRef, useState } from "react"
import { startVideoDetection, getVideoStatus } from "./api"
import type { DetectionResult } from "./types"
import DetectionResults from "./DetectionResults"

interface Props {
  family?: string
}

export default function VideoUpload({ family = "tagStandard52h13" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [detections, setDetections] = useState<DetectionResult[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    setStatus("uploading")
    setError(null)
    setDetections([])
    setProgress(0)

    try {
      const { job_id } = await startVideoDetection(file, family)
      setStatus("processing")
      await pollJob(job_id)
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Error desconocido")
    }
  }

  async function pollJob(jobId: string) {
    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const res = await getVideoStatus(jobId)
          setProgress(res.progress)
          if (res.status === "done") {
            clearInterval(interval)
            setDetections(res.detections ?? [])
            setStatus("done")
            resolve()
          } else if (res.status === "error") {
            clearInterval(interval)
            setStatus("error")
            setError(res.error ?? "Error en el procesamiento")
            reject(new Error(res.error ?? "Error"))
          }
        } catch (err) {
          clearInterval(interval)
          setStatus("error")
          setError(err instanceof Error ? err.message : "Error de conexión")
          reject(err)
        }
      }, 500)
    })
  }

  const busy = status === "uploading" || status === "processing"

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Graba un video de 5–10 segundos barriendo el palet lentamente y súbelo aquí.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full h-16 rounded-2xl bg-purple-600 text-white text-lg font-bold flex items-center justify-center gap-3 active:bg-purple-700 disabled:opacity-60 transition-colors"
      >
        <VideoIcon />
        {busy ? "Procesando…" : "Seleccionar video"}
      </button>

      {/* Barra de progreso */}
      {busy && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{status === "uploading" ? "Subiendo…" : "Analizando frames…"}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {status === "done" && (
        <DetectionResults
          detections={detections}
          onClear={() => { setStatus("idle"); setDetections([]) }}
        />
      )}
    </div>
  )
}

function VideoIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

"use client"

import { useRef, useState } from "react"
import { detectPhoto } from "./api"
import type { DetectionResult } from "./types"
import DetectionResults from "./DetectionResults"

interface Props {
  accumulated: DetectionResult[]
  onAccumulate: (results: DetectionResult[]) => void
  onClear: () => void
  family?: string
}

export default function CameraCapture({ accumulated, onAccumulate, onClear, family = "tagStandard52h13" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAnnotated, setLastAnnotated] = useState<string | null>(null)
  const [lastCount, setLastCount] = useState(0)
  const [expectedCount, setExpectedCount] = useState<number | null>(null)

  async function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    setLoading(true)
    setError(null)
    try {
      const res = await detectPhoto(file, expectedCount ?? undefined, family)
      setLastAnnotated(res.detections.length > 0 ? res.annotated_image : null)
      setLastCount(res.detections.length)
      onAccumulate(res.detections)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Estado acumulado */}
      {accumulated.length > 0 && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-sm font-semibold text-blue-800">
            Acumulado: {accumulated.length} tags únicos
          </p>
          <p className="text-xs text-blue-700 mt-0.5 font-mono break-all">
            [{accumulated.map((d) => d.tag_id).sort((a, b) => a - b).join(", ")}]
          </p>
        </div>
      )}

      {/* Campo de conteo esperado */}
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 space-y-1">
        <label className="text-xs font-medium text-gray-600">
          ¿Cuántas cajas hay? <span className="font-normal text-gray-400">(opcional)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={expectedCount ?? ""}
            onChange={(e) => {
              const v = parseInt(e.target.value)
              setExpectedCount(isNaN(v) || v < 1 ? null : v)
            }}
            placeholder="—"
            className="w-20 h-9 rounded-lg border border-gray-300 px-3 text-sm font-mono text-gray-800 focus:outline-none focus:border-blue-400"
          />
          <span className="text-sm text-gray-500">cajas</span>
        </div>
      </div>

      {/* Botón de captura */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="w-full h-20 rounded-2xl bg-green-600 text-white text-xl font-bold flex items-center justify-center gap-3 active:bg-green-700 disabled:opacity-60 transition-colors"
      >
        {loading ? (
          <>
            <Spinner />
            Procesando…
          </>
        ) : (
          <>
            <CameraIcon />
            Capturar foto
          </>
        )}
      </button>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Última foto anotada */}
      {lastAnnotated && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium">
            Última foto — {lastCount} tag{lastCount !== 1 ? "s" : ""} detectado{lastCount !== 1 ? "s" : ""}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/jpeg;base64,${lastAnnotated}`}
            alt="Imagen anotada"
            className="w-full rounded-xl border border-gray-200"
          />
        </div>
      )}

      {/* Resultados acumulados */}
      <DetectionResults detections={accumulated} expectedCount={expectedCount} onClear={onClear} />
    </div>
  )
}

function CameraIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

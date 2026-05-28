"use client"

import { useRef, useState } from "react"
import { detectPhoto } from "./api"
import type { DetectionResult } from "./types"
import DetectionResults from "./DetectionResults"

interface PhotoResult {
  name: string
  detections: DetectionResult[]
  annotated_image: string
  newCount: number
  error?: string
}

interface Props {
  family?: string
}

export default function PhotoUpload({ family = "tagStandard52h13" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<PhotoResult[]>([])
  const [accumulated, setAccumulated] = useState<DetectionResult[]>([])
  const [expectedCount, setExpectedCount] = useState<number | null>(null)
  const [newInBatch, setNewInBatch] = useState<number | null>(null)

  function handleNewSession() {
    setResults([])
    setAccumulated([])
    setNewInBatch(null)
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ""

    setLoading(true)
    setNewInBatch(null)

    // Snapshot del acumulado actual para calcular cuántos son nuevos en este lote
    const prevAccMap = new Map(accumulated.map((d) => [d.tag_id, d]))
    const accMap = new Map(prevAccMap)

    for (const file of files) {
      const sizeBeforeFile = accMap.size
      let result: PhotoResult
      try {
        const res = await detectPhoto(file, expectedCount ?? undefined, family)
        for (const d of res.detections) {
          const ex = accMap.get(d.tag_id)
          if (!ex || d.confidence > ex.confidence) accMap.set(d.tag_id, d)
        }
        result = {
          name: file.name,
          detections: res.detections,
          annotated_image: res.annotated_image,
          newCount: accMap.size - sizeBeforeFile,
        }
      } catch (err) {
        result = {
          name: file.name,
          detections: [],
          annotated_image: "",
          newCount: 0,
          error: err instanceof Error ? err.message : "Error",
        }
      }
      // Actualizar progresivamente — cada foto aparece al terminar de procesarse
      setResults((prev) => [...prev, result])
      setAccumulated(Array.from(accMap.values()))
    }

    setNewInBatch(accMap.size - prevAccMap.size)
    setLoading(false)
  }

  const hasResults = accumulated.length > 0

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Sube varias fotos desde distintos ángulos. Cada imagen se procesa con 7 variantes y tiling 2×2.
      </p>

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

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      <div className="flex gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex-1 h-16 rounded-2xl bg-orange-500 text-white text-lg font-bold flex items-center justify-center gap-3 active:bg-orange-600 disabled:opacity-60 transition-colors"
        >
          <PhotoIcon />
          {loading ? "Procesando fotos…" : hasResults ? "Agregar más fotos" : "Seleccionar fotos"}
        </button>
        {hasResults && !loading && (
          <button
            onClick={handleNewSession}
            className="h-16 px-4 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-sm active:bg-gray-200 transition-colors"
          >
            Nueva{"\n"}sesión
          </button>
        )}
      </div>

      {/* Banner de convergencia (solo sin expectedCount) */}
      {newInBatch !== null && !expectedCount && hasResults && (
        <div className={`rounded-xl px-4 py-2.5 border text-sm font-medium ${
          newInBatch === 0
            ? "bg-blue-50 border-blue-200 text-blue-700"
            : "bg-green-50 border-green-200 text-green-700"
        }`}>
          {newInBatch === 0
            ? "Sin tags nuevos en la última carga — posiblemente completo"
            : `+${newInBatch} tag${newInBatch !== 1 ? "s" : ""} nuevos en esta carga`}
        </div>
      )}

      {/* Resultados por foto */}
      {results.map((r, i) => (
        <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 truncate max-w-[60%]">{r.name}</span>
            <div className="flex items-center gap-2">
              {r.newCount > 0 && (
                <span className="text-xs text-green-600 font-semibold">+{r.newCount} nuevos</span>
              )}
              <span className="text-xs text-gray-500">{r.detections.length} tags</span>
            </div>
          </div>
          {r.error ? (
            <div className="px-4 py-3 text-sm text-red-600">{r.error}</div>
          ) : (
            <div className="p-3 space-y-2">
              {r.annotated_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/jpeg;base64,${r.annotated_image}`}
                  alt={`Anotada ${r.name}`}
                  className="w-full rounded-lg"
                />
              )}
              {r.detections.length > 0 ? (
                <p className="text-xs font-mono text-gray-600">
                  IDs: [{r.detections.map((d) => d.tag_id).sort((a, b) => a - b).join(", ")}]
                </p>
              ) : (
                <p className="text-xs text-gray-400">No se detectaron tags</p>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Acumulado total */}
      {hasResults && (
        <>
          <hr className="border-gray-200" />
          <h3 className="text-sm font-semibold text-gray-700">Resumen acumulado</h3>
          <DetectionResults
            detections={accumulated}
            expectedCount={expectedCount}
            onClear={handleNewSession}
          />
        </>
      )}
    </div>
  )
}

function PhotoIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

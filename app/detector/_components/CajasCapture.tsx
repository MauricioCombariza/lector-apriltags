"use client"

import { useRef, useState } from "react"
import { detectCajasPhoto } from "./api"
import type { CajasPhotoEntry } from "./types"

const MAX_PHOTOS = 4

function subtotal(p: CajasPhotoEntry): number {
  return Math.max(0, p.detected + p.to_add - p.to_subtract)
}

export default function CajasCapture() {
  const [photos, setPhotos] = useState<CajasPhotoEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setError(null)
    setLoading(true)
    try {
      const res = await detectCajasPhoto(file)
      setPhotos((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          annotated_image: res.annotated_image,
          detected: res.detected_lateral,
          pallet_detected: res.pallet_detected,
          to_add: 0,
          to_subtract: 0,
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la foto")
    } finally {
      setLoading(false)
    }
  }

  function update(id: string, field: "to_add" | "to_subtract", value: number) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  function remove(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  const total = photos.reduce((acc, p) => acc + subtotal(p), 0)
  const canCapture = photos.length < MAX_PHOTOS && !loading

  return (
    <div className="space-y-4">
      {/* Botón captura */}
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
        disabled={!canCapture}
        className={`w-full h-20 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 transition-colors ${
          canCapture
            ? "bg-blue-600 text-white active:bg-blue-700"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {loading ? (
          <>
            <Spinner />
            Procesando…
          </>
        ) : photos.length >= MAX_PHOTOS ? (
          "Máximo 4 fotos por pallet"
        ) : (
          <>
            <BoxIcon />
            Capturar foto {photos.length + 1}/{MAX_PHOTOS}
          </>
        )}
      </button>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tarjetas por foto */}
      {photos.map((photo, i) => {
        const sub = subtotal(photo)
        return (
          <div key={photo.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
              <span className="font-semibold text-gray-700 text-sm">Foto {i + 1}</span>
              <div className="flex items-center gap-2">
                {!photo.pallet_detected && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Sin pallet
                  </span>
                )}
                <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {photo.detected} detectadas
                </span>
                <button
                  onClick={() => remove(photo.id)}
                  className="text-gray-400 hover:text-red-500 text-xl leading-none"
                  aria-label="Eliminar foto"
                >
                  ×
                </button>
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/jpeg;base64,${photo.annotated_image}`}
              alt={`Foto ${i + 1}`}
              className="w-full object-contain max-h-60"
            />

            <div className="px-4 py-3 space-y-3">
              <div className="flex gap-3">
                <label className="flex-1">
                  <span className="block text-xs text-gray-500 mb-1">+ Cajas a sumar</span>
                  <input
                    type="number"
                    min={0}
                    value={photo.to_add}
                    onChange={(e) => update(photo.id, "to_add", Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full border border-green-300 rounded-lg px-3 py-2 text-center text-lg font-semibold text-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </label>
                <label className="flex-1">
                  <span className="block text-xs text-gray-500 mb-1">− Cajas a descontar</span>
                  <input
                    type="number"
                    min={0}
                    value={photo.to_subtract}
                    onChange={(e) => update(photo.id, "to_subtract", Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full border border-red-300 rounded-lg px-3 py-2 text-center text-lg font-semibold text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </label>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2">
                <span className="text-sm text-gray-500">Subtotal foto {i + 1}</span>
                <span className="text-2xl font-bold text-gray-800">{sub}</span>
              </div>
            </div>
          </div>
        )
      })}

      {/* Resumen total */}
      {photos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm">Resumen del pallet</h3>
          </div>
          <div className="px-4 py-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Foto</th>
                  <th className="text-center pb-2 font-medium">Det.</th>
                  <th className="text-center pb-2 font-medium text-green-600">+</th>
                  <th className="text-center pb-2 font-medium text-red-600">−</th>
                  <th className="text-right pb-2 font-medium">Sub.</th>
                </tr>
              </thead>
              <tbody>
                {photos.map((p, i) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-1.5 text-gray-600">{i + 1}</td>
                    <td className="py-1.5 text-center text-blue-700 font-medium">{p.detected}</td>
                    <td className="py-1.5 text-center text-green-700">{p.to_add > 0 ? `+${p.to_add}` : "—"}</td>
                    <td className="py-1.5 text-center text-red-700">{p.to_subtract > 0 ? `−${p.to_subtract}` : "—"}</td>
                    <td className="py-1.5 text-right font-semibold">{subtotal(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-4 bg-gray-800 flex items-center justify-between">
            <span className="text-gray-300 font-medium">Total cajas del pallet</span>
            <span className="text-white font-bold text-4xl">{total}</span>
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => { setPhotos([]); setError(null) }}
              className="w-full py-2 text-sm text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 rounded-xl transition-colors"
            >
              Nuevo pallet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BoxIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
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

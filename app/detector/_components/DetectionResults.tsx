"use client"

import type { DetectionResult } from "./types"

interface Props {
  detections: DetectionResult[]
  expectedCount?: number | null
  onClear?: () => void
}

function confidenceBadge(confidence: number): string {
  if (confidence >= 4) return "bg-green-100 text-green-800 border-green-200"
  if (confidence >= 2) return "bg-yellow-100 text-yellow-800 border-yellow-200"
  return "bg-red-100 text-red-800 border-red-200"
}

function downloadExcel(detections: DetectionResult[]) {
  // Genera CSV (sin dependencia npm extra, funciona igual de bien en campo)
  const rows = [
    ["ID Tag", "Confianza"],
    ...detections.map((d) => [d.tag_id.toString(), d.label]),
  ]
  const csv = rows.map((r) => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `apriltags_${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function DetectionResults({ detections, expectedCount, onClear }: Props) {
  if (detections.length === 0) return null

  const ids = detections.map((d) => d.tag_id).sort((a, b) => a - b)
  const lowConfidence = detections.filter((d) => d.confidence < 2)

  const hasExpected = expectedCount != null && expectedCount > 0
  const isComplete = hasExpected && detections.length >= expectedCount
  const missing = hasExpected ? expectedCount - detections.length : 0

  const summaryStyle = hasExpected
    ? isComplete
      ? "rounded-xl bg-green-50 border border-green-200 px-4 py-3"
      : "rounded-xl bg-orange-50 border border-orange-200 px-4 py-3"
    : "rounded-xl bg-green-50 border border-green-200 px-4 py-3"

  return (
    <div className="mt-4 space-y-3">
      {/* Resumen */}
      <div className={summaryStyle}>
        {hasExpected ? (
          <>
            <p className={`text-sm font-semibold ${isComplete ? "text-green-800" : "text-orange-800"}`}>
              {isComplete ? "✅" : "⚠️"} {detections.length}/{expectedCount}
              {" — "}
              {isComplete ? "Completo" : `Faltan ${missing} etiqueta${missing !== 1 ? "s" : ""}`}
            </p>
            <p className={`text-xs mt-0.5 font-mono break-all ${isComplete ? "text-green-700" : "text-orange-700"}`}>
              [{ids.join(", ")}]
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-green-800">
              {detections.length} tag{detections.length !== 1 ? "s" : ""} detectado{detections.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-green-700 mt-0.5 font-mono break-all">
              [{ids.join(", ")}]
            </p>
          </>
        )}
      </div>

      {/* Alerta baja confianza */}
      {lowConfidence.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
          <p className="text-xs text-red-700">
            🔴 {lowConfidence.length} tag{lowConfidence.length !== 1 ? "s" : ""} con baja confianza
            {" "}(IDs: {lowConfidence.map((d) => d.tag_id).sort((a, b) => a - b).join(", ")})
            {" — "}considera tomar más fotos de esas áreas
          </p>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2.5 text-left font-semibold text-gray-600">ID Tag</th>
              <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Confianza</th>
            </tr>
          </thead>
          <tbody>
            {detections
              .slice()
              .sort((a, b) => a.tag_id - b.tag_id)
              .map((d) => (
                <tr key={d.tag_id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">
                    {d.tag_id}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${confidenceBadge(d.confidence)}`}
                    >
                      {d.label}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          onClick={() => downloadExcel(detections)}
          className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-semibold text-sm active:bg-blue-700 transition-colors"
        >
          Descargar CSV
        </button>
        {onClear && (
          <button
            onClick={onClear}
            className="h-12 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm active:bg-gray-200 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}

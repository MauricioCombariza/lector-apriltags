"use client"

import { useState } from "react"
import CameraCapture from "./_components/CameraCapture"
import VideoUpload from "./_components/VideoUpload"
import PhotoUpload from "./_components/PhotoUpload"
import type { DetectionResult } from "./_components/types"

type Tab = "camera" | "video" | "photos"

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "camera", label: "Cámara", icon: "📸" },
  { id: "video",  label: "Video",  icon: "🎬" },
  { id: "photos", label: "Fotos",  icon: "🖼️" },
]

export default function DetectorPage() {
  const [tab, setTab] = useState<Tab>("camera")
  const [accumulated, setAccumulated] = useState<DetectionResult[]>([])

  function handleAccumulate(newResults: DetectionResult[]) {
    setAccumulated((prev) => {
      const map = new Map(prev.map((d) => [d.tag_id, d]))
      for (const d of newResults) {
        const ex = map.get(d.tag_id)
        if (!ex || d.confidence > ex.confidence) map.set(d.tag_id, d)
      }
      return Array.from(map.values())
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <h1 className="text-base font-bold text-gray-900">Lector AprilTags</h1>
        <p className="text-xs text-gray-500">tag36h11 · AgriVision</p>
      </header>

      {/* Contenido */}
      <main className="flex-1 px-4 py-4 pb-24 max-w-lg mx-auto w-full">
        {tab === "camera" && (
          <CameraCapture
            accumulated={accumulated}
            onAccumulate={handleAccumulate}
            onClear={() => setAccumulated([])}
          />
        )}
        {tab === "video" && <VideoUpload />}
        {tab === "photos" && <PhotoUpload />}
      </main>

      {/* Tab bar fija abajo */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? "text-green-700 bg-green-50"
                : "text-gray-500 active:bg-gray-50"
            }`}
          >
            <span className="text-xl leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

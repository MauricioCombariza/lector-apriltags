import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Lector AprilTags — AgriVision",
  description: "Lectura de etiquetas AprilTags tag36h11 para inventario de flores",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}

import type React from "react"
import type { Metadata, Viewport } from "next"
import { Nunito } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "Quadro de Recompensas do Gabriel ⭐",
  description: "Um app divertido para acompanhar as conquistas do Gabriel!",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#58cc02",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans antialiased ${nunito.className}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

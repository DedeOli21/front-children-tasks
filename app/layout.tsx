import type React from "react"
import type { Metadata, Viewport } from "next"
import { Nunito } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { Providers } from "@/components/providers"
import "./globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "Quadro de Recompensas ⭐",
  description: "Um app divertido para acompanhar tarefas e conquistas das crianças!",
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
        <Providers>{children}</Providers>
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  )
}

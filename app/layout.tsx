import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import ClientWrapper from "./components/ClientWrapper"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

export const metadata: Metadata = {
  title: "FKUS | Colección Exclusiva",
  description: "Catálogo de piezas de indumentaria ultra exclusivas y premium de FKUS.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geist.variable} antialiased`}>
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  )
}

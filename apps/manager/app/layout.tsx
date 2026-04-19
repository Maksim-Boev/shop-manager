import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Shop Manager",
  description: "Управление магазином",
}

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
    <body suppressHydrationWarning className="antialiased">
      {children}
    </body>
  </html>
)

export default RootLayout

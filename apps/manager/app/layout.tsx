import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { cookies } from 'next/headers'
import { auth } from '@/auth'
import { DashboardShell } from '@/components/layout/DashboardShell'
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

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth()
  const cookieStore = await cookies()
  const defaultCompact = cookieStore.get('sidebar_compact')?.value === 'true'
  const theme = cookieStore.get('theme')?.value === 'dark' ? 'dark' : 'light'

  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable}${theme === 'dark' ? ' dark' : ''}`}
    >
      <body suppressHydrationWarning className="antialiased">
        {session ? (
          <DashboardShell user={session.user} defaultCompact={defaultCompact} defaultTheme={theme}>
            {children}
          </DashboardShell>
        ) : (
          children
        )}
      </body>
    </html>
  )
}

export default RootLayout

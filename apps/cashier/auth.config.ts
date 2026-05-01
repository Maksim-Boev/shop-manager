import type { NextAuthConfig } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      companyId: string | null
      role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER'
      firstName: string
      lastName: string
    }
  }
}

export const authConfig = {
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl
      if (pathname.startsWith('/api/auth') || pathname === '/login') return true
      if (!auth) return false
      if (auth.user.role === 'SUPER_ADMIN') return false
      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig

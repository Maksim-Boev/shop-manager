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

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    companyId?: string | null
    role?: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER'
    firstName?: string
    lastName?: string
    checkedAt?: number
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
    session({ session, token }) {
      session.user.id        = token.id as string
      session.user.companyId = token.companyId as string | null
      session.user.role      = token.role as 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER'
      session.user.firstName = token.firstName as string
      session.user.lastName  = token.lastName as string
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig

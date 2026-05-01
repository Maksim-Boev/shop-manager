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
      if (!auth?.user?.role) return false
      if (auth.user.role === 'SUPER_ADMIN') return false
      return true
    },
    session({ session, token }) {
      session.user = {
        ...(session.user ?? {}),
        id:        token.id        as string,
        companyId: token.companyId as string | null,
        role:      token.role      as 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER',
        firstName: token.firstName as string,
        lastName:  token.lastName  as string,
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig

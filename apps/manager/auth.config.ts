import type { NextAuthConfig } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import type { AuthUser, JwtClaims, UserRole } from '@pkg/db'

declare module 'next-auth' {
  interface Session {
    user: AuthUser
  }
  interface User extends AuthUser {}
}

declare module 'next-auth/jwt' {
  interface JWT extends JwtClaims {}
}

const BLOCKED_ROLE: UserRole = 'CASHIER'

export const authConfig = {
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl
      if (pathname.startsWith('/api/auth') || pathname === '/login') return true
      if (!auth?.user?.role) return false
      if (auth.user.role === BLOCKED_ROLE) return false
      return true
    },
    session({ session, token }) {
      session.user.id        = token.id
      session.user.companyId = token.companyId
      session.user.role      = token.role
      session.user.firstName = token.firstName
      session.user.lastName  = token.lastName
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig

export type { JWT }

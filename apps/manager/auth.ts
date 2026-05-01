import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma, verifyCredentials } from '@pkg/db'
import type { AuthUser } from '@pkg/db'
import { authConfig } from './auth.config'

const ONE_HOUR = 60 * 60 * 1000

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      authorize: (credentials) => {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
          return null
        }
        return verifyCredentials(email, password)
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60, updateAge: 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as AuthUser
        token.id        = u.id
        token.companyId = u.companyId
        token.role      = u.role
        token.firstName = u.firstName
        token.lastName  = u.lastName
        token.checkedAt = Date.now()
        return token
      }
      if (token.id && Date.now() - (token.checkedAt ?? 0) > ONE_HOUR) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { status: true },
        })
        if (!dbUser || dbUser.status === 'BLOCKED') return null
        token.checkedAt = Date.now()
      }
      return token
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
  pages: { signIn: '/login' },
})

'use server'
import { AuthError } from 'next-auth'
import { signIn } from '@/auth'

export const loginAction = async (
  _: string | null,
  formData: FormData,
): Promise<string | null> => {
  const email = formData.get('email')
  const password = formData.get('password')
  if (typeof email !== 'string' || typeof password !== 'string') {
    return 'Невірний email або пароль'
  }
  try {
    await signIn('credentials', { email, password, redirectTo: '/' })
    return null
  } catch (error) {
    if (error instanceof AuthError && error.type === 'CredentialsSignin') {
      return 'Невірний email або пароль'
    }
    throw error
  }
}

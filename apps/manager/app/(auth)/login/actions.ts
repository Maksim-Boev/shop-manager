'use server'
import { AuthError } from 'next-auth'
import { signIn } from '@/auth'

export const loginAction = async (
  _: string | null,
  formData: FormData,
): Promise<string | null> => {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/',
    })
    return null
  } catch (error) {
    if (error instanceof AuthError) {
      return 'Невірний email або пароль'
    }
    throw error // re-throw для NEXT_REDIRECT
  }
}

'use client'
import { useActionState } from 'react'
import { Button } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { loginAction } from './actions'

const inputClass = cn(
  'w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white',
  'placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-indigo-500 focus-visible:border-transparent',
)

const LoginPage = () => {
  const [error, formAction, isPending] = useActionState(loginAction, null)

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm px-4">
        <div className="mb-8 text-center">
          <div className="size-12 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <svg viewBox="0 0 20 20" className="size-6" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h14l-1.5 9.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5L3 7Z"/>
              <path d="M7 7V5a3 3 0 0 1 6 0v2"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Каса</h1>
          <p className="text-sm text-slate-400 mt-1">Увійдіть у систему</p>
        </div>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={inputClass}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-rose-400">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Входимо…' : 'Увійти'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default LoginPage

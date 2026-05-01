'use client'
import { useActionState } from 'react'
import { Button } from '@pkg/ui'
import { cn } from '@pkg/ui/cn'
import { loginAction } from './actions'

const inputClass = cn(
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
  'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-indigo-500 focus-visible:border-transparent',
)

const LoginPage = () => {
  const [error, formAction, isPending] = useActionState(loginAction, null)

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm px-4">
        <div className="mb-8 text-center">
          <div className="size-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-indigo-600/30">
            <svg viewBox="0 0 20 20" className="size-6" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h14l-1.5 9.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5L3 7Z"/>
              <path d="M7 7V5a3 3 0 0 1 6 0v2"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Shop Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Увійдіть у систему</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6">
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
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
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
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
              <p role="alert" className="text-sm text-rose-600">{error}</p>
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

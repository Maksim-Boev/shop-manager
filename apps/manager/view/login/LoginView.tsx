'use client'
import { useState, useEffect } from 'react'
import { X, ShieldCheck, Lock, MapPin } from 'lucide-react'
import { cn } from '@pkg/ui/cn'
import { SignInForm } from './components/sign-in-form'
import { SignUpForm } from './components/sign-up-form'
import { ForgotPasswordForm } from './components/forgot-password-form'
import type { TAuthView, TAuthTab } from './types'

const CSS_VARS: React.CSSProperties = {
  '--background': '240 10% 4%',
  '--foreground': '0 0% 98%',
  '--card': '240 8% 6%',
  '--card-foreground': '0 0% 98%',
  '--muted': '240 5% 10%',
  '--muted-foreground': '240 5% 65%',
  '--border': '240 6% 14%',
  '--input': '240 6% 12%',
  '--ring': '252 95% 70%',
  '--primary': '252 87% 67%',
  '--primary-foreground': '0 0% 100%',
  '--destructive': '0 84% 60%',
  '--radius': '0.625rem',
} as React.CSSProperties

const TITLE: Record<TAuthView, Record<TAuthTab, string>> = {
  main: { signin: 'Ласкаво просимо назад', signup: 'Створіть акаунт' },
  forgot: { signin: 'Відновлення пароля', signup: 'Відновлення пароля' },
}

const SUBTITLE: Record<TAuthView, Record<TAuthTab, string>> = {
  main: {
    signin: 'Увійдіть, щоб керувати своєю мережею',
    signup: 'Запустіть свою мережу за 2 хвилини',
  },
  forgot: { signin: '', signup: '' },
}

const LoginView = () => {
  const [view, setView] = useState<TAuthView>('main')
  const [tab, setTab] = useState<TAuthTab>('signin')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && view !== 'main') setView('main')
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [view])

  return (
    <div
      style={CSS_VARS}
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      // match prototype's body background
    >
      {/* Background effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 0%, hsl(252 87% 50% / 0.18), transparent 50%), radial-gradient(circle at 80% 100%, hsl(280 80% 50% / 0.12), transparent 50%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(252 30% 16% / 0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(252 30% 16% / 0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 80%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Card */}
        <div
          className="rounded-2xl border overflow-hidden relative"
          style={{
            background: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            boxShadow:
              '0 0 0 1px hsl(0 0% 100% / 0.04) inset, 0 24px 48px -12px hsl(252 87% 30% / 0.4), 0 0 80px -20px hsl(252 87% 50% / 0.3)',
          }}
        >
          {/* Top glow accent */}
          <div
            className="absolute -top-px left-1/2 -translate-x-1/2 h-px w-2/3 pointer-events-none"
            style={{ background: 'linear-gradient(to right, transparent, hsl(var(--primary)), transparent)' }}
          />

          {/* Back button (non-main views) */}
          {view !== 'main' && (
            <button
              onClick={() => setView('main')}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'hsl(var(--muted))'
                e.currentTarget.style.color = 'hsl(var(--foreground))'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = ''
                e.currentTarget.style.color = 'hsl(var(--muted-foreground))'
              }}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Header */}
          <div className="px-7 pt-7 pb-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, hsl(252 87% 67%), hsl(280 80% 60%))',
                  boxShadow: '0 4px 12px hsl(252 87% 50% / 0.4)',
                }}
              >
                <svg viewBox="0 0 20 20" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7h14l-1.5 9.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5L3 7Z" />
                  <path d="M7 7V5a3 3 0 0 1 6 0v2" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                  ShopManager
                </div>
                <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Retail OS
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
              {TITLE[view][tab]}
            </h2>
            {SUBTITLE[view][tab] && (
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {SUBTITLE[view][tab]}
              </p>
            )}
          </div>

          {/* Tabs (main view only) */}
          {view === 'main' && (
            <div className="px-7 mb-5">
              <div
                className="grid grid-cols-2 p-1 rounded-[var(--radius)] gap-1 relative"
                style={{ background: 'hsl(var(--muted))' }}
              >
                <div
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-[calc(var(--radius)-2px)] border transition-transform duration-300"
                  style={{
                    background: 'hsl(240 8% 10%)',
                    borderColor: 'hsl(var(--border))',
                    boxShadow: '0 1px 0 0 hsl(0 0% 100% / 0.04) inset, 0 1px 2px hsl(0 0% 0% / 0.4)',
                    transform: tab === 'signup' ? 'translateX(calc(100% + 4px))' : 'translateX(0)',
                  }}
                />
                {(['signin', 'signup'] as TAuthTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      'relative z-10 py-2 text-xs font-semibold transition-colors',
                      tab === t ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
                    )}
                  >
                    {t === 'signin' ? 'Вхід' : 'Реєстрація'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="px-7 pb-7 max-h-[70vh] overflow-y-auto">
            {view === 'main' && tab === 'signin' && <SignInForm onForgot={() => setView('forgot')} />}
            {view === 'main' && tab === 'signup' && <SignUpForm />}
            {view === 'forgot' && <ForgotPasswordForm onBack={() => setView('main')} />}
          </div>

          {/* Footer */}
          {view === 'main' && (
            <div
              className="px-7 py-4 text-center border-t"
              style={{
                background: 'hsl(var(--muted) / 0.4)',
                borderColor: 'hsl(var(--border))',
              }}
            >
              <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {tab === 'signin' ? 'Ще немає акаунта? ' : 'Вже маєте акаунт? '}
                <button
                  onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
                  className="font-semibold hover:underline"
                  style={{ color: 'hsl(var(--primary))' }}
                >
                  {tab === 'signin' ? 'Створити' : 'Увійти'}
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Trust badges */}
        {view === 'main' && (
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Шифрування TLS 1.3</div>
            <div className="flex items-center gap-1"><Lock className="w-3 h-3" /> SOC 2 Type II</div>
            <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Дані в Україні</div>
          </div>
        )}
      </div>
    </div>
  )
}

export { LoginView }

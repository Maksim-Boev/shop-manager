'use client'
import { useActionState, useState } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@pkg/ui/cn'
import { loginAction } from '@/app/(auth)/login/actions'

interface ISignInFormProps {
  onForgot: () => void
}

const SignInForm = ({ onForgot }: ISignInFormProps) => {
  const [error, formAction, isPending] = useActionState(loginAction, null)
  const [showPwd, setShowPwd] = useState(false)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="signin-email" className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">
          Робочий email
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] pointer-events-none" />
          <input
            id="signin-email"
            name="email"
            type="email"
            placeholder="you@company.com.ua"
            autoComplete="email"
            required
            className={cn(
              'w-full pl-9 pr-3 h-10 text-sm bg-[hsl(var(--input))] border border-[hsl(var(--border))]',
              'rounded-[var(--radius)] outline-none transition-all',
              'text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]',
              'focus:border-[hsl(var(--ring))] focus:ring-[3px] focus:ring-[hsl(var(--ring)/0.2)]',
            )}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="signin-password" className="text-xs font-medium text-[hsl(var(--foreground))]">
            Пароль
          </label>
          <button
            type="button"
            onClick={onForgot}
            className="text-[11px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
          >
            Забули пароль?
          </button>
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] pointer-events-none" />
          <input
            id="signin-password"
            name="password"
            type={showPwd ? 'text' : 'password'}
            placeholder="Введіть пароль"
            autoComplete="current-password"
            required
            className={cn(
              'w-full pl-9 pr-10 h-10 text-sm bg-[hsl(var(--input))] border border-[hsl(var(--border))]',
              'rounded-[var(--radius)] outline-none transition-all',
              'text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]',
              'focus:border-[hsl(var(--ring))] focus:ring-[3px] focus:ring-[hsl(var(--ring)/0.2)]',
            )}
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] rounded transition-colors"
          >
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-[11px] text-[hsl(var(--destructive))] flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          'w-full h-10 px-4 text-sm font-medium rounded-[var(--radius)] transition-all',
          'inline-flex items-center justify-center gap-2',
          'bg-[hsl(var(--primary))] text-white',
          'hover:bg-[hsl(252_87%_72%)]',
          'shadow-[0_1px_0_0_hsl(0_0%_100%/0.1)_inset,0_0_0_1px_hsl(252_87%_50%),0_2px_8px_hsl(252_87%_30%/0.4)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Вхід...
          </>
        ) : (
          <>
            Увійти
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  )
}

export default SignInForm

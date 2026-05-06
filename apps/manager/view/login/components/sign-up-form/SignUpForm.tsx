'use client'
import { useActionState, useState } from 'react'
import { User, Building2, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, Check, CheckCircle2, Circle, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@pkg/ui/cn'
import { registerAction } from '@/app/(auth)/login/actions'
import { PlanOption } from '../plan-option'
import type { ISignUpStep1, ISignUpStep1Errors, TPlan } from './types'

const inputClass = cn(
  'w-full h-10 text-sm bg-[hsl(var(--input))] border border-[hsl(var(--border))]',
  'rounded-[var(--radius)] outline-none transition-all',
  'text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]',
  'focus:border-[hsl(var(--ring))] focus:ring-[3px] focus:ring-[hsl(var(--ring)/0.2)]',
)
const inputErrorClass = 'border-[hsl(var(--destructive))] focus:ring-[hsl(var(--destructive)/0.2)] focus:border-[hsl(var(--destructive))]'

const passwordStrength = (p: string) => {
  if (!p) return { score: 0, label: '', color: 'transparent' }
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  const map = [
    { label: '', color: 'transparent' },
    { label: 'Слабкий', color: 'hsl(0 84% 60%)' },
    { label: 'Слабкий', color: 'hsl(0 84% 60%)' },
    { label: 'Середній', color: 'hsl(38 92% 50%)' },
    { label: 'Надійний', color: 'hsl(142 71% 45%)' },
    { label: 'Сильний', color: 'hsl(142 71% 45%)' },
  ]
  return { score, ...map[score] }
}

const SignUpForm = () => {
  const [error, formAction, isPending] = useActionState(registerAction, null)
  const [step, setStep] = useState<1 | 2>(1)
  const [step1, setStep1] = useState<ISignUpStep1>({ name: '', company: '', email: '', plan: 'pro' })
  const [step1Errors, setStep1Errors] = useState<ISignUpStep1Errors>({})
  const [showPwd, setShowPwd] = useState(false)
  const [password, setPassword] = useState('')
  const [terms, setTerms] = useState(false)
  const strength = passwordStrength(password)

  const update1 = (k: keyof ISignUpStep1, v: string | TPlan) => {
    setStep1((prev) => ({ ...prev, [k]: v }))
    if (step1Errors[k as keyof ISignUpStep1Errors]) {
      setStep1Errors((prev) => ({ ...prev, [k]: undefined }))
    }
  }

  const goNext = () => {
    const errs: ISignUpStep1Errors = {}
    if (!step1.name || step1.name.length < 2) errs.name = "Введіть ім'я (мін. 2 символи)"
    if (!step1.company) errs.company = 'Введіть назву компанії'
    if (!step1.email) errs.email = "Email обов'язковий"
    else if (!/^\S+@\S+\.\S+$/.test(step1.email)) errs.email = 'Невірний формат'
    setStep1Errors(errs)
    if (!Object.keys(errs).length) setStep(2)
  }

  const passwordRules = [
    { ok: password.length >= 8, label: 'Не менше 8 символів' },
    { ok: /[A-Z]/.test(password) && /[a-z]/.test(password), label: 'Великі та малі літери' },
    { ok: /\d/.test(password), label: 'Хоча б одна цифра' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'Спеціальний символ' },
  ]

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
            step >= 1 ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
          )}>
            {step > 1 ? <Check className="w-3 h-3" /> : '1'}
          </div>
          <span className={cn('text-[11px] font-medium', step >= 1 ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]')}>
            Профіль
          </span>
        </div>
        <div className="flex-1 h-px bg-[hsl(var(--border))] relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-[hsl(var(--primary))] transition-all duration-500"
            style={{ width: step >= 2 ? '100%' : '0%' }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
            step >= 2 ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
          )}>
            2
          </div>
          <span className={cn('text-[11px] font-medium', step >= 2 ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]')}>
            Безпека
          </span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-[fadeIn_.3s_ease-out]">
          <div className="grid grid-cols-2 gap-3">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">Ім'я</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Олена"
                  value={step1.name}
                  onChange={(e) => update1('name', e.target.value)}
                  className={cn(inputClass, 'pl-9 pr-3', step1Errors.name && inputErrorClass)}
                />
              </div>
              {step1Errors.name && (
                <p className="text-[11px] text-[hsl(var(--destructive))] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />{step1Errors.name}
                </p>
              )}
            </div>
            {/* Company */}
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">Компанія</label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] pointer-events-none" />
                <input
                  type="text"
                  placeholder="ТОВ Ритейл"
                  value={step1.company}
                  onChange={(e) => update1('company', e.target.value)}
                  className={cn(inputClass, 'pl-9 pr-3', step1Errors.company && inputErrorClass)}
                />
              </div>
              {step1Errors.company && (
                <p className="text-[11px] text-[hsl(var(--destructive))] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />{step1Errors.company}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">Робочий email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] pointer-events-none" />
              <input
                type="email"
                placeholder="you@company.com.ua"
                value={step1.email}
                onChange={(e) => update1('email', e.target.value)}
                className={cn(inputClass, 'pl-9 pr-3', step1Errors.email && inputErrorClass)}
              />
            </div>
            {step1Errors.email && (
              <p className="text-[11px] text-[hsl(var(--destructive))] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />{step1Errors.email}
              </p>
            )}
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">Тарифний план</label>
            <div className="grid grid-cols-2 gap-2">
              <PlanOption
                value="starter"
                active={step1.plan === 'starter'}
                onClick={() => update1('plan', 'starter')}
                title="Starter"
                desc="До 3 магазинів"
                price="₴ 0"
                badge="Безкоштовно"
              />
              <PlanOption
                value="pro"
                active={step1.plan === 'pro'}
                onClick={() => update1('plan', 'pro')}
                title="Pro"
                desc="Без обмежень"
                price="₴ 1 490"
                badge="Популярний"
                featured
              />
            </div>
          </div>

          <button
            type="button"
            onClick={goNext}
            className={cn(
              'w-full h-10 px-4 text-sm font-medium rounded-[var(--radius)] transition-all',
              'inline-flex items-center justify-center gap-2',
              'bg-[hsl(var(--primary))] text-white hover:bg-[hsl(252_87%_72%)]',
              'shadow-[0_1px_0_0_hsl(0_0%_100%/0.1)_inset,0_0_0_1px_hsl(252_87%_50%),0_2px_8px_hsl(252_87%_30%/0.4)]',
            )}
          >
            Продовжити <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <form action={formAction} className="space-y-4 animate-[fadeIn_.3s_ease-out]">
          {/* Hidden step 1 fields */}
          <input type="hidden" name="name" value={step1.name} />
          <input type="hidden" name="company" value={step1.company} />
          <input type="hidden" name="email" value={step1.email} />

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">Пароль</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] pointer-events-none" />
              <input
                name="password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Створіть пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(inputClass, 'pl-9 pr-10')}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] rounded transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
              Мінімум 8 символів. Великі літери, цифри й символи зроблять його сильнішим.
            </p>
          </div>

          {/* Strength meter */}
          {password && (
            <div>
              <div className="flex gap-1 mb-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{ background: i <= Math.min(4, strength.score) ? strength.color : 'hsl(var(--border))' }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[hsl(var(--muted-foreground))]">Надійність:</span>
                <span className="font-semibold" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            </div>
          )}

          {/* Rules checklist */}
          <div className="bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] rounded-[var(--radius)] p-3 space-y-1.5">
            {passwordRules.map((rule, i) => (
              <div key={i} className={cn('flex items-center gap-2 text-[11px] transition-colors', rule.ok ? 'text-[hsl(142_71%_55%)]' : 'text-[hsl(var(--muted-foreground))]')}>
                {rule.ok
                  ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  : <Circle className="w-3.5 h-3.5 shrink-0" />}
                {rule.label}
              </div>
            ))}
          </div>

          {/* Terms */}
          <label htmlFor="terms" className="flex items-start gap-2 cursor-pointer group select-none">
            <div className="relative mt-0.5">
              <input
                id="terms"
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="sr-only"
              />
              <div className={cn(
                'w-4 h-4 rounded border transition-all flex items-center justify-center',
                terms ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))]' : 'bg-[hsl(var(--input))] border-[hsl(var(--border))] group-hover:border-[hsl(var(--primary))]',
              )}>
                {terms && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              </div>
            </div>
            <span className="text-xs text-[hsl(var(--muted-foreground))] leading-5">
              Я приймаю{' '}
              <a href="#" className="text-[hsl(var(--primary))] hover:underline">умови використання</a>
              {' '}та{' '}
              <a href="#" className="text-[hsl(var(--primary))] hover:underline">політику конфіденційності</a>
            </span>
          </label>

          {error && (
            <p role="alert" className="text-[11px] text-[hsl(var(--destructive))] flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />{error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={cn(
                'h-10 px-4 text-sm font-medium rounded-[var(--radius)] transition-all',
                'inline-flex items-center justify-center gap-2',
                'border border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--muted))]',
                'text-[hsl(var(--foreground))]',
              )}
            >
              <ArrowLeft className="w-4 h-4" /> Назад
            </button>
            <button
              type="submit"
              disabled={isPending || !terms}
              className={cn(
                'flex-1 h-10 px-4 text-sm font-medium rounded-[var(--radius)] transition-all',
                'inline-flex items-center justify-center gap-2',
                'bg-[hsl(var(--primary))] text-white hover:bg-[hsl(252_87%_72%)]',
                'shadow-[0_1px_0_0_hsl(0_0%_100%/0.1)_inset,0_0_0_1px_hsl(252_87%_50%),0_2px_8px_hsl(252_87%_30%/0.4)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Створення...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Створити акаунт</>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export { SignUpForm }

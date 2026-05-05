'use client'
import { useActionState } from 'react'
import { Mail, KeyRound, Send, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@pkg/ui/cn'
import { forgotPasswordAction } from '@/app/(auth)/login/actions'

interface IForgotPasswordFormProps {
  onBack: () => void
}

const ForgotPasswordForm = ({ onBack }: IForgotPasswordFormProps) => {
  const [sent, formAction, isPending] = useActionState(forgotPasswordAction, false)

  if (sent) {
    return (
      <div className="space-y-5 text-center animate-[fadeIn_.3s_ease-out]">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[hsl(142_71%_45%/0.15)] border border-[hsl(142_71%_45%/0.3)] flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-[hsl(142_71%_55%)]" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Посилання надіслано</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Якщо акаунт з таким email існує — ми надіслали інструкції для відновлення пароля.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'w-full h-10 px-4 text-sm font-medium rounded-[var(--radius)] transition-all',
            'inline-flex items-center justify-center gap-2',
            'border border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--muted))]',
            'text-[hsl(var(--foreground))]',
          )}
        >
          <ArrowLeft className="w-4 h-4" /> Повернутися до входу
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4 animate-[fadeIn_.3s_ease-out]">
      <div className="text-center mb-2">
        <div className="w-12 h-12 mx-auto rounded-xl bg-[hsl(var(--primary)/0.15)] border border-[hsl(var(--primary)/0.3)] flex items-center justify-center mb-3">
          <KeyRound className="w-5 h-5 text-[hsl(252_100%_85%)]" />
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Введіть email — надішлемо посилання для скидання
        </p>
      </div>

      <div>
        <label htmlFor="forgot-email" className="block text-xs font-medium text-[hsl(var(--foreground))] mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] pointer-events-none" />
          <input
            id="forgot-email"
            name="email"
            type="email"
            placeholder="you@company.com.ua"
            required
            autoFocus
            className={cn(
              'w-full pl-9 pr-3 h-10 text-sm bg-[hsl(var(--input))] border border-[hsl(var(--border))]',
              'rounded-[var(--radius)] outline-none transition-all',
              'text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]',
              'focus:border-[hsl(var(--ring))] focus:ring-[3px] focus:ring-[hsl(var(--ring)/0.2)]',
            )}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          'w-full h-10 px-4 text-sm font-medium rounded-[var(--radius)] transition-all',
          'inline-flex items-center justify-center gap-2',
          'bg-[hsl(var(--primary))] text-white hover:bg-[hsl(252_87%_72%)]',
          'shadow-[0_1px_0_0_hsl(0_0%_100%/0.1)_inset,0_0_0_1px_hsl(252_87%_50%),0_2px_8px_hsl(252_87%_30%/0.4)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Надсилання...</>
        ) : (
          <><Send className="w-4 h-4" /> Надіслати посилання</>
        )}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex items-center justify-center gap-1 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Повернутися до входу
      </button>
    </form>
  )
}

export default ForgotPasswordForm

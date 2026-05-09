'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PencilIcon, WalletIcon } from 'lucide-react'
import {
  Card, CardContent, Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@pkg/ui'
import { setUserSalary } from '@/actions/staff'
import type { ISalaryCardProps } from './types'

const PERIOD_LABEL: Record<string, string> = {
  HOUR:  'год.',
  DAY:   'день',
  WEEK:  'тиж.',
  MONTH: 'міс.',
}

const PERIOD_OPTIONS = [
  { value: 'HOUR',  label: 'Погодинно' },
  { value: 'DAY',   label: 'Денна ставка' },
  { value: 'WEEK',  label: 'Тижнева ставка' },
  { value: 'MONTH', label: 'Місячна ставка' },
]

const fmtUAH = (n: number) =>
  `₴ ${n.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const SalaryCard = ({ userId, currentRate, actorRole }: ISalaryCardProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [ratePeriod, setRatePeriod] = useState<string>(currentRate?.ratePeriod ?? 'MONTH')
  const [rateAmount, setRateAmount] = useState<string>(currentRate ? String(currentRate.rateAmount) : '')
  const [salesPercent, setSalesPercent] = useState<string>(
    currentRate?.salesPercent ? String(currentRate.salesPercent) : '',
  )

  const canEdit = actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN'

  const handleOpen = () => {
    setRatePeriod(currentRate?.ratePeriod ?? 'MONTH')
    setRateAmount(currentRate ? String(currentRate.rateAmount) : '')
    setSalesPercent(currentRate?.salesPercent ? String(currentRate.salesPercent) : '')
    setError(null)
    setOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(rateAmount)
    const pct = parseFloat(salesPercent || '0')
    if (isNaN(amount) || amount < 0) {
      setError('Введіть коректну суму ставки')
      return
    }
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setError('Відсоток від 0 до 100')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await setUserSalary({
          userId,
          ratePeriod,
          rateAmount: amount,
          salesPercent: pct,
        })
        setOpen(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Помилка')
      }
    })
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-muted-foreground uppercase font-bold tracking-wide">
              <WalletIcon className="size-3.5" />
              Зарплата
            </div>
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={handleOpen} className="gap-1.5 h-7 text-xs">
                <PencilIcon className="size-3" />
                {currentRate ? 'Змінити' : 'Встановити'}
              </Button>
            )}
          </div>

          {currentRate ? (
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-foreground tabular-nums">
                {fmtUAH(currentRate.rateAmount)}
                <span className="text-base font-normal text-slate-500 dark:text-muted-foreground ml-1">
                  / {PERIOD_LABEL[currentRate.ratePeriod]}
                </span>
              </div>
              {currentRate.salesPercent > 0 && (
                <div className="text-sm text-slate-500 dark:text-muted-foreground mt-1">
                  + {currentRate.salesPercent}% від продажів
                </div>
              )}
              <div className="text-xs text-slate-400 dark:text-muted-foreground mt-2">
                Діє з {currentRate.effectiveFrom.toLocaleDateString('uk-UA')}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-slate-400 dark:text-muted-foreground">Ставку не встановлено</p>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={handleOpen} className="mt-3">
                  Встановити ставку
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Встановити ставку</DialogTitle>
            <DialogDescription>
              Нова ставка набирає чинності негайно і закриває попередню.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-foreground">
                Тип ставки
              </label>
              <Select value={ratePeriod} onValueChange={setRatePeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-foreground">
                Сума, грн.
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={rateAmount}
                onChange={e => setRateAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-foreground">
                % від продажів{' '}
                <span className="text-slate-400 font-normal">(необов'язково)</span>
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
                value={salesPercent}
                onChange={e => setSalesPercent(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Скасувати
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Зберігаю…' : 'Зберегти'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { SalaryCard }

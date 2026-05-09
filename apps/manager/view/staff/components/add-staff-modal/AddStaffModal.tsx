'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Input, Button,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@pkg/ui'
import { createStaffMember } from '@/actions/staff'
import type { IAddStaffModalProps } from './types'

const ROLE_OPTIONS = [
  { value: 'CASHIER',     label: 'Касир' },
  { value: 'SALESPERSON', label: 'Продавець' },
  { value: 'MANAGER',     label: 'Менеджер' },
  { value: 'ADMIN',       label: 'Адміністратор' },
]

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'CASHIER',
  storeIds: [] as string[],
}

const AddStaffModal = ({ open, onClose, stores }: IAddStaffModalProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(EMPTY)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof typeof EMPTY>(key: K) => (value: typeof EMPTY[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleClose = () => {
    if (pending) return
    setForm(EMPTY)
    setError(null)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createStaffMember({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        storeIds: form.storeIds,
      })
      if ('error' in result) {
        setError(result.error)
        return
      }
      handleClose()
      router.refresh()
    })
  }

  const isValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.password.length >= 6

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Додати співробітника</DialogTitle>
          <DialogDescription>
            Новий акаунт отримає доступ до системи з тимчасовим паролем.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-foreground">
                Ім'я <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Іван"
                value={form.firstName}
                onChange={e => set('firstName')(e.target.value)}
                disabled={pending}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-foreground">
                Прізвище <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Петренко"
                value={form.lastName}
                onChange={e => set('lastName')(e.target.value)}
                disabled={pending}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-foreground">
              Email <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="ivan@example.com"
              value={form.email}
              onChange={e => set('email')(e.target.value)}
              disabled={pending}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-foreground">
                Роль <span className="text-rose-500">*</span>
              </label>
              <Select value={form.role} onValueChange={set('role')}>
                <SelectTrigger disabled={pending}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-foreground">
                Магазини
              </label>
              <div className="border border-slate-200 dark:border-border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                {stores.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-muted-foreground px-1 py-2">
                    Немає магазинів
                  </p>
                ) : (
                  stores.map(s => {
                    const checked = form.storeIds.includes(s.id)
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-muted/40 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={pending}
                          onChange={() =>
                            set('storeIds')(
                              checked
                                ? form.storeIds.filter(id => id !== s.id)
                                : [...form.storeIds, s.id],
                            )
                          }
                          className="size-4 accent-indigo-600"
                        />
                        <span className="text-slate-700 dark:text-foreground">{s.name}</span>
                      </label>
                    )
                  })
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-muted-foreground">
                {form.storeIds.length === 0 ? 'Без призначення' : `Обрано: ${form.storeIds.length}`}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-foreground">
              Тимчасовий пароль <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Мінімум 6 символів"
                value={form.password}
                onChange={e => set('password')(e.target.value)}
                disabled={pending}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-foreground"
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 dark:text-muted-foreground">
              Повідомте пароль співробітнику особисто.
            </p>
          </div>

          {error && (
            <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={pending}>
              Скасувати
            </Button>
            <Button type="submit" disabled={pending || !isValid}>
              {pending ? 'Створюю…' : 'Створити'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { AddStaffModal }

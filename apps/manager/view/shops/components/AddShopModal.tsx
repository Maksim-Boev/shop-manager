'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SparklesIcon } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input, Button,
} from '@pkg/ui'
import { createShop } from '@/actions/shop'
import type { IAddShopModalProps } from '../types'

const AddShopModal = ({ open, onOpenChange }: IAddShopModalProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setAddress('')
    setError(null)
  }

  const handleOpenChange = (v: boolean) => {
    if (isPending) return
    if (!v) reset()
    onOpenChange(v)
  }

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      try {
        await createShop({ name: name.trim(), address: address.trim() || undefined })
        reset()
        onOpenChange(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Додати магазин</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Назва магазину <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Наприклад: ТЦ Оазис, вул. Хрещатик"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isPending && name.trim() && handleSubmit()}
              disabled={isPending}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Адреса</label>
            <Input
              placeholder="Вулиця, будинок"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isPending && name.trim() && handleSubmit()}
              disabled={isPending}
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <SparklesIcon className="size-4" />
            </div>
            <div className="text-sm">
              <div className="font-semibold text-indigo-900">Готово до роботи одразу</div>
              <div className="text-xs text-indigo-700 mt-0.5">
                Після створення магазин з'явиться у списку. Додати менеджерів та налаштувати склад можна на сторінці магазину.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name.trim()}
          >
            {isPending ? 'Створення…' : 'Створити магазин'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { AddShopModal }

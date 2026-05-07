'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MapPinIcon, SparklesIcon } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Input, Button,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@pkg/ui'
import { createShop } from '@/actions/shop'
import type { IAddShopModalProps } from './types'

const CITIES = ['Київ', 'Львів', 'Одеса', 'Харків', 'Дніпро', 'Запоріжжя', 'Миколаїв']

const AddShopModal = ({ open, onOpenChange }: IAddShopModalProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [region, setRegion] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setAddress('')
    setRegion('')
    setPhone('')
    setArea('')
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
        await createShop({
          name: name.trim(),
          address: address.trim() || undefined,
          region: region || undefined,
          phone: phone.trim() || undefined,
          area: area ? Number(area) : undefined,
        })
        reset()
        onOpenChange(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      }
    })
  }

  const canSubmit = name.trim().length > 0 && address.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новий магазин</DialogTitle>
          <DialogDescription>
            Заповніть основну інформацію — решту можна додати пізніше
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Назва — full width */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 tracking-wide">
              Назва магазину <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Наприклад: АТБ Дарниця"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isPending}
              autoFocus
            />
          </div>

          {/* Адреса — full width with icon */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 tracking-wide">
              Адреса <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
              <Input
                className="pl-8"
                placeholder="Вулиця, будинок"
                value={address}
                onChange={e => setAddress(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Місто */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 tracking-wide">Місто</label>
            <Select value={region} onValueChange={setRegion} disabled={isPending}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Оберіть місто" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Телефон */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 tracking-wide">Телефон точки</label>
            <Input
              placeholder="+380..."
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Площа */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 tracking-wide">Площа, м²</label>
            <Input
              type="number"
              placeholder="0"
              value={area}
              onChange={e => setArea(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Керуючий — placeholder only */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 tracking-wide">Керуючий</label>
            <Select disabled>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Виберіть пізніше" />
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>
        </div>

        {/* Info banner */}
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <SparklesIcon className="size-4" />
          </div>
          <div className="text-sm">
            <div className="font-semibold text-indigo-900">Пустий склад створюється автоматично</div>
            <div className="text-xs text-indigo-700 mt-0.5">
              Після створення ви зможете поповнити його через накладну з центрального складу.
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !canSubmit}>
            {isPending ? 'Створення…' : 'Створити магазин'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { AddShopModal }

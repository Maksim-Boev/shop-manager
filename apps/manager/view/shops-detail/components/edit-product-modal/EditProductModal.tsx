'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Input, Button,
} from '@pkg/ui'
import { updateProduct } from '@/actions/products'
import type { IEditProductModalProps } from './types'

const UNIT_LABELS: Record<string, string> = {
  PIECE: 'шт.', KG: 'кг', GRAM: 'г', LITER: 'л',
  MILLILITER: 'мл', METER: 'м', PACK: 'уп.',
}

const EditProductModal = ({ open, onOpenChange, product }: IEditProductModalProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [basePrice, setBasePrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (product) {
      setBasePrice(product.basePrice.toString())
      setCostPrice(product.costPrice === null ? '' : product.costPrice.toString())
      setError(null)
    }
  }, [product])

  const handleOpenChange = (v: boolean) => {
    if (isPending) return
    onOpenChange(v)
  }

  const handleSubmit = () => {
    if (!product) return
    setError(null)
    const parsedBase = Number(basePrice)
    if (Number.isNaN(parsedBase) || parsedBase < 0) {
      setError('Ціна має бути ≥ 0')
      return
    }
    const parsedCost = costPrice.trim() === '' ? null : Number(costPrice)
    if (parsedCost !== null && (Number.isNaN(parsedCost) || parsedCost < 0)) {
      setError('Закупівельна ціна має бути ≥ 0 або порожньою')
      return
    }

    startTransition(async () => {
      try {
        await updateProduct({
          productId: product.id,
          basePrice: parsedBase,
          costPrice: parsedCost,
        })
        onOpenChange(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      }
    })
  }

  const lossWarning =
    basePrice !== '' &&
    costPrice !== '' &&
    !Number.isNaN(Number(basePrice)) &&
    !Number.isNaN(Number(costPrice)) &&
    Number(costPrice) > Number(basePrice)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редагувати товар</DialogTitle>
          <DialogDescription>
            Зміна цін діє глобально по компанії — у всіх магазинах.
          </DialogDescription>
        </DialogHeader>

        {product && (
          <div className="space-y-4">
            <div className="text-sm">
              <div className="font-semibold text-slate-900 dark:text-foreground">{product.name}</div>
              <div className="text-xs text-slate-500 dark:text-muted-foreground">
                <span className="font-mono">{product.sku}</span>
                {' · '}
                {UNIT_LABELS[product.unit] ?? product.unit}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-muted-foreground tracking-wide">
                Ціна продажу, ₴
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={basePrice}
                onChange={e => setBasePrice(e.target.value)}
                disabled={isPending}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-muted-foreground tracking-wide">
                Закупівельна ціна, ₴ (необов&apos;язково)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Не вказана"
                value={costPrice}
                onChange={e => setCostPrice(e.target.value)}
                disabled={isPending}
              />
              {lossWarning && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  Закупівельна ціна більша за ціну продажу — буде збиток.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
                Скасувати
              </Button>
              <Button onClick={handleSubmit} disabled={isPending || basePrice === ''}>
                {isPending ? 'Збереження…' : 'Зберегти'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { EditProductModal }

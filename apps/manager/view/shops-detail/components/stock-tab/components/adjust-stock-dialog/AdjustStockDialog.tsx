'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Button, Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@pkg/ui'
import { createManualAdjustment } from '@/actions/manual-adjustment'
import type { IAdjustStockDialogProps } from './types'

const UNIT_LABELS: Record<string, string> = {
  PIECE: 'шт.', KG: 'кг', GRAM: 'г', LITER: 'л',
  MILLILITER: 'мл', METER: 'м', PACK: 'уп.',
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
  </div>
)

const AdjustStockDialog = ({
  open, onOpenChange, storeId, allProducts, currentStock,
}: IAdjustStockDialogProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedStock = useMemo(
    () => productId ? (currentStock.get(productId) ?? null) : null,
    [productId, currentStock],
  )

  const handleClose = (v: boolean) => {
    if (isPending) return
    if (!v) {
      setProductId('')
      setQuantity('')
      setReason('')
      setError(null)
    }
    onOpenChange(v)
  }

  const handleSubmit = () => {
    const qty = parseFloat(quantity)
    if (!productId || isNaN(qty) || qty === 0 || reason.trim().length < 3) {
      setError("Заповніть усі обов'язкові поля")
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await createManualAdjustment({ storeId, productId, quantity: qty, reason: reason.trim() })
        handleClose(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Коригування залишків</DialogTitle>
          <DialogDescription>
            Оберіть товар, вкажіть кількість зі знаком (+/−) та причину.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field label="Товар *">
            <Select value={productId} onValueChange={setProductId} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть товар" />
              </SelectTrigger>
              <SelectContent>
                {allProducts.map((product) => {
                  const stock = currentStock.get(product.id)
                  const unitLabel = UNIT_LABELS[product.unit] ?? product.unit
                  return (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} — {product.sku}
                      {stock !== undefined ? ` (залишок: ${stock} ${unitLabel})` : ''}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </Field>

          {selectedStock !== null && (
            <p className="text-xs text-muted-foreground -mt-2">
              Поточний залишок: <span className="font-semibold">{selectedStock}</span>
            </p>
          )}

          <Field label="Кількість * (+ надходження, − списання)">
            <Input
              type="number"
              step="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Наприклад: 10 або -3"
              disabled={isPending}
            />
          </Field>

          <Field label="Причина *">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Мін. 3 символи"
              disabled={isPending}
            />
          </Field>
        </div>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={isPending}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Збереження…' : 'Застосувати'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { AdjustStockDialog }

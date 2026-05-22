'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Button, Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@pkg/ui'
import { createProduct } from '@/actions/products'
import { QuickAddCategoryDialog } from './components/quick-add-category-dialog'
import type { IAddProductDialogProps } from './types'

const UNIT_OPTIONS = [
  { value: 'PIECE', label: 'штука' },
  { value: 'KG', label: 'кілограм' },
  { value: 'GRAM', label: 'грам' },
  { value: 'LITER', label: 'літр' },
  { value: 'MILLILITER', label: 'мілілітр' },
  { value: 'METER', label: 'метр' },
  { value: 'PACK', label: 'пачка' },
]

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
  </div>
)

const AddProductDialog = ({ open, onOpenChange, categories, taxRates }: IAddProductDialogProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  const defaultTaxRate = taxRates.find((rate) => rate.isDefault)?.id ?? taxRates[0]?.id ?? ''

  const [form, setForm] = useState({
    name: '',
    sku: '',
    unit: 'PIECE',
    basePrice: '',
    costPrice: '',
    taxRateId: defaultTaxRate,
    categoryId: '',
    subcategoryId: '',
  })

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const subcategories =
    categories.find((category) => category.id === form.categoryId)?.subcategories ?? []

  const handleClose = (v: boolean) => {
    if (isPending) return
    if (!v) {
      setForm({
        name: '',
        sku: '',
        unit: 'PIECE',
        basePrice: '',
        costPrice: '',
        taxRateId: defaultTaxRate,
        categoryId: '',
        subcategoryId: '',
      })
      setError(null)
    }
    onOpenChange(v)
  }

  const handleCategoryCreated = (categoryId: string) => {
    set('categoryId')(categoryId)
    router.refresh()
  }

  const handleSubmit = () => {
    if (!form.name || !form.sku || !form.basePrice || !form.categoryId || !form.taxRateId) {
      setError("Заповніть усі обов'язкові поля")
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await createProduct({
          name: form.name,
          sku: form.sku,
          unit: form.unit,
          basePrice: parseFloat(form.basePrice),
          costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
          taxRateId: form.taxRateId,
          categoryId: form.categoryId,
          subcategoryId: form.subcategoryId || null,
        })
        handleClose(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Новий товар</DialogTitle>
            <DialogDescription>
              Заповніть основні дані товару. Ціни й залишки можна уточнити пізніше.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Назва *">
              <Input
                value={form.name}
                onChange={(e) => set('name')(e.target.value)}
                placeholder="Наприклад: Молоко 2,5%"
                disabled={isPending}
                className="col-span-2"
              />
            </Field>

            <Field label="SKU *">
              <Input
                value={form.sku}
                onChange={(e) => set('sku')(e.target.value)}
                placeholder="MILK-001"
                disabled={isPending}
              />
            </Field>

            <Field label="Одиниця виміру *">
              <Select value={form.unit} onValueChange={set('unit')} disabled={isPending}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Категорія *">
              <Select
                value={form.categoryId}
                onValueChange={(v) => { set('categoryId')(v); set('subcategoryId')('') }}
                disabled={isPending}
              >
                <SelectTrigger><SelectValue placeholder="Оберіть категорію" /></SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                  <div className="border-t border-border mt-1 pt-1 px-1">
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setQuickAddOpen(true)
                      }}
                      className="w-full text-left text-sm text-primary px-2 py-1.5 rounded hover:bg-muted transition-colors"
                    >
                      + Додати категорію
                    </button>
                  </div>
                </SelectContent>
              </Select>
            </Field>

            {form.categoryId && (
              <Field label="Підкатегорія">
                <Select
                  value={form.subcategoryId || '__none__'}
                  onValueChange={(v) => set('subcategoryId')(v === '__none__' ? '' : v)}
                  disabled={isPending || subcategories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Не вказано" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Не вказано</SelectItem>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field label="Ставка ПДВ *">
              <Select value={form.taxRateId} onValueChange={set('taxRateId')} disabled={isPending}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {taxRates.map((rate) => (
                    <SelectItem key={rate.id} value={rate.id}>
                      {rate.name} ({rate.rate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Ціна продажу (грн.) *">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.basePrice}
                onChange={(e) => set('basePrice')(e.target.value)}
                placeholder="0.00"
                disabled={isPending}
              />
            </Field>

            <Field label="Закупна ціна (грн.)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={(e) => set('costPrice')(e.target.value)}
                placeholder="0.00"
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
              {isPending ? 'Створення…' : 'Створити товар'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <QuickAddCategoryDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onCreated={handleCategoryCreated}
      />
    </>
  )
}

export { AddProductDialog }

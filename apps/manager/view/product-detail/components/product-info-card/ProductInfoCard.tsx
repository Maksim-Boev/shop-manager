'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PencilIcon } from 'lucide-react'
import {
  Card, CardContent, CardHeader,
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@pkg/ui'
import { updateProductInfo } from '@/actions/products'
import type { IProductInfoCardProps } from './types'

const UNIT_OPTIONS = [
  { value: 'PIECE', label: 'штука' },
  { value: 'KG', label: 'кілограм' },
  { value: 'GRAM', label: 'грам' },
  { value: 'LITER', label: 'літр' },
  { value: 'MILLILITER', label: 'мілілітр' },
  { value: 'METER', label: 'метр' },
  { value: 'PACK', label: 'пачка' },
]

const UNIT_LABELS: Record<string, string> = Object.fromEntries(UNIT_OPTIONS.map(o => [o.value, o.label]))

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm text-foreground text-right">{value}</span>
  </div>
)

const ProductInfoCard = ({ product, categories, taxRates, canEdit }: IProductInfoCardProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: product.name,
    sku: product.sku,
    unit: product.unit,
    taxRateId: product.taxRateId,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId ?? '',
    basePrice: String(product.basePrice),
    costPrice: product.costPrice !== null ? String(product.costPrice) : '',
  })

  const set = (k: keyof typeof form) => (v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const subcategories = categories.find(c => c.id === form.categoryId)?.subcategories ?? []

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      try {
        await updateProductInfo({
          productId: product.id,
          name: form.name,
          sku: form.sku,
          unit: form.unit,
          basePrice: parseFloat(form.basePrice),
          costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
          taxRateId: form.taxRateId,
          categoryId: form.categoryId,
          subcategoryId: form.subcategoryId || null,
        })
        setOpen(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      }
    })
  }

  const createdDate = product.createdAt.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h3 className="font-semibold text-foreground">Інформація</h3>
          {canEdit && (
            <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)}>
              <PencilIcon className="size-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <Row label="SKU" value={<span className="font-mono text-xs">{product.sku}</span>} />
          <Row label="Одиниця виміру" value={UNIT_LABELS[product.unit] ?? product.unit} />
          <Row label="Категорія" value={product.categoryName} />
          {product.subcategoryName && <Row label="Підкатегорія" value={product.subcategoryName} />}
          <Row label="Ставка ПДВ" value={`${product.taxRateName} (${product.taxRate}%)`} />
          <Row label="Додано" value={createdDate} />
        </CardContent>
      </Card>

      {canEdit && (
        <Dialog open={open} onOpenChange={v => { if (!isPending) setOpen(v) }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Редагувати товар</DialogTitle>
              <DialogDescription>Змініть дані товару. Ціни оновлюються в усіх магазинах.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium">Назва *</label>
                <Input value={form.name} onChange={e => set('name')(e.target.value)} disabled={isPending} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">SKU *</label>
                <Input value={form.sku} onChange={e => set('sku')(e.target.value)} disabled={isPending} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Одиниця виміру *</label>
                <Select value={form.unit} onValueChange={set('unit')} disabled={isPending}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Категорія *</label>
                <Select value={form.categoryId} onValueChange={v => { set('categoryId')(v); set('subcategoryId')('') }} disabled={isPending}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {subcategories.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Підкатегорія</label>
                  <Select value={form.subcategoryId} onValueChange={set('subcategoryId')} disabled={isPending}>
                    <SelectTrigger><SelectValue placeholder="Не вказано" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Не вказано</SelectItem>
                      {subcategories.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Ставка ПДВ *</label>
                <Select value={form.taxRateId} onValueChange={set('taxRateId')} disabled={isPending}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {taxRates.map(r => <SelectItem key={r.id} value={r.id}>{r.name} ({r.rate}%)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Ціна продажу (грн.) *</label>
                <Input type="number" min="0" step="0.01" value={form.basePrice} onChange={e => set('basePrice')(e.target.value)} disabled={isPending} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Закупна ціна (грн.)</label>
                <Input type="number" min="0" step="0.01" value={form.costPrice} onChange={e => set('costPrice')(e.target.value)} placeholder="—" disabled={isPending} />
              </div>
            </div>

            {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>Скасувати</Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? 'Збереження…' : 'Зберегти'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export { ProductInfoCard }

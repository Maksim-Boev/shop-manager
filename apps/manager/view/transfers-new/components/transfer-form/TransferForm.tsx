'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { Button } from '@pkg/ui'
import { StoreSelector } from '../store-selector'
import { ProductLineItem } from '../product-line-item'
import { createTransfer } from '@/actions/transfers'
import type { ITransferFormProps, IFormItem } from './types'

const TransferForm = ({ stores, productsByStore }: ITransferFormProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [sourceId, setSourceId] = useState('')
  const [destId, setDestId] = useState('')
  const [items, setItems] = useState<IFormItem[]>([
    { key: 0, productId: '', quantity: '' },
  ])

  const sourceProducts = productsByStore[sourceId] ?? []

  const addItem = () => {
    setItems(prev => [...prev, { key: Date.now(), productId: '', quantity: '' }])
  }
  const removeItem = (key: number) => {
    setItems(prev => prev.filter(i => i.key !== key))
  }
  const updateItem = (key: number, patch: Partial<IFormItem>) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, ...patch } : i))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validItems = items
      .filter(i => i.productId && i.quantity)
      .map(i => ({ productId: i.productId, quantity: Number(i.quantity) }))
      .filter(i => i.quantity > 0)

    if (!sourceId || !destId) {
      setError('Оберіть джерело та приймач')
      return
    }
    if (validItems.length === 0) {
      setError('Додайте хоча б одну позицію')
      return
    }

    startTransition(async () => {
      try {
        await createTransfer({
          sourceStoreId: sourceId,
          destinationStoreId: destId,
          items: validItems,
        })
        router.push('/transfers')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Помилка')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StoreSelector
          label="Звідки"
          value={sourceId}
          onChange={(v) => {
            setSourceId(v)
            setItems([{ key: Date.now(), productId: '', quantity: '' }])
          }}
          stores={stores}
          disabledId={destId}
        />
        <StoreSelector
          label="Куди"
          value={destId}
          onChange={setDestId}
          stores={stores}
          disabledId={sourceId}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-foreground">
            Позиції
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
            <PlusIcon className="size-3.5" />
            Додати
          </Button>
        </div>

        {!sourceId && (
          <p className="text-xs text-slate-400 dark:text-muted-foreground">
            Спочатку оберіть джерело
          </p>
        )}

        {sourceId && items.map(item => (
          <ProductLineItem
            key={item.key}
            productId={item.productId}
            quantity={item.quantity}
            onProduct={id => updateItem(item.key, { productId: id })}
            onQuantity={q => updateItem(item.key, { quantity: q })}
            onRemove={() => removeItem(item.key)}
            options={sourceProducts.filter(o =>
              o.productId === item.productId ||
              !items.some(i => i.productId === o.productId),
            )}
          />
        ))}
      </div>

      {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}

      <div className="flex items-center gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/transfers')}
          disabled={pending}
        >
          Скасувати
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Створюю…' : 'Створити чернетку'}
        </Button>
      </div>
    </form>
  )
}

export { TransferForm }

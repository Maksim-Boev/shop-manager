'use client'

import { TrashIcon } from 'lucide-react'
import {
  Button, Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@pkg/ui'
import type { IProductLineItemProps } from './types'

const ProductLineItem = ({
  productId, quantity, onProduct, onQuantity, onRemove, options,
}: IProductLineItemProps) => {
  const selected = options.find(o => o.productId === productId)

  return (
    <div className="grid grid-cols-12 gap-2 items-end">
      <div className="col-span-7">
        <Select value={productId} onValueChange={onProduct}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Оберіть товар" />
          </SelectTrigger>
          <SelectContent>
            {options.map(o => (
              <SelectItem key={o.productId} value={o.productId}>
                <span className="font-mono text-xs text-slate-500 dark:text-muted-foreground mr-2">
                  {o.sku}
                </span>
                <span>{o.name}</span>
                <span className="text-xs text-slate-400 dark:text-muted-foreground ml-2">
                  (зал.: {o.stock.toLocaleString('uk-UA')})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-3">
        <Input
          type="number"
          min="0"
          step="0.001"
          placeholder="К-сть"
          value={quantity}
          onChange={e => onQuantity(e.target.value)}
        />
        {selected && (
          <p className="text-[10px] text-slate-400 dark:text-muted-foreground mt-0.5">
            макс. {selected.stock.toLocaleString('uk-UA')} {selected.unit.toLowerCase()}
          </p>
        )}
      </div>
      <div className="col-span-2 flex justify-end">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="text-slate-400 hover:text-rose-600 dark:text-muted-foreground dark:hover:text-rose-300"
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export { ProductLineItem }

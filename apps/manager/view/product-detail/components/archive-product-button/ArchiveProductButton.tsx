'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArchiveIcon } from 'lucide-react'
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@pkg/ui'
import { archiveProduct } from '@/actions/products'
import type { IArchiveProductButtonProps } from './types'

const ArchiveProductButton = ({ productId, productName }: IArchiveProductButtonProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await archiveProduct({ productId })
        setOpen(false)
        router.push('/products')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Сталася помилка')
      }
    })
  }

  return (
    <>
      <Button variant="outline-destructive" onClick={() => setOpen(true)}>
        <ArchiveIcon className="size-4" />
        Архівувати
      </Button>

      <Dialog open={open} onOpenChange={v => { if (!isPending) setOpen(v) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Архівувати товар?</DialogTitle>
            <DialogDescription>
              Товар &laquo;{productName}&raquo; буде переведено в архів і прихований з каталогу. Дію можна скасувати пізніше.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Скасувати
            </Button>
            <Button variant="destructive-solid" onClick={handleConfirm} disabled={isPending}>
              {isPending ? 'Архівування…' : 'Так, архівувати'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { ArchiveProductButton }

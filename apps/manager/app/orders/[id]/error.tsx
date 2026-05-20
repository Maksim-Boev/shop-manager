'use client'

import Link from 'next/link'
import { Button } from '@pkg/ui'

interface IErrorPageProps {
  error: Error
  reset: () => void
}

const OrderDetailError = ({ error, reset }: IErrorPageProps) => (
  <div className="flex flex-col items-center justify-center min-h-96 gap-4">
    <p className="text-muted-foreground">Сталася помилка: {error.message}</p>
    <div className="flex gap-3">
      <Button variant="outline" asChild>
        <Link href="/orders">До списку продаж</Link>
      </Button>
      <Button onClick={reset}>Спробувати знову</Button>
    </div>
  </div>
)

export default OrderDetailError

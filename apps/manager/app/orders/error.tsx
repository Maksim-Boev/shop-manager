'use client'

import { Button } from '@pkg/ui'

interface IErrorPageProps {
  error: Error
  reset: () => void
}

const OrdersError = ({ error, reset }: IErrorPageProps) => (
  <div className="flex flex-col items-center justify-center min-h-96 gap-4">
    <p className="text-muted-foreground">Сталася помилка: {error.message}</p>
    <Button onClick={reset}>Спробувати знову</Button>
  </div>
)

export default OrdersError

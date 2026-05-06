'use client'

import { Button } from '@pkg/ui'

interface IErrorProps {
  error: Error
  reset: () => void
}

const ShopDetailError = ({ error, reset }: IErrorProps) => (
  <div className="flex flex-col items-center justify-center min-h-96 gap-4">
    <p className="text-slate-600">Сталася помилка: {error.message}</p>
    <Button onClick={reset}>Спробувати знову</Button>
  </div>
)

export default ShopDetailError

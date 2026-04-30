export class ShopError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ShiftAlreadyOpenError extends ShopError {}
export class ShiftNotOpenError extends ShopError {}
export class OrderStateError extends ShopError {}
export class ProductNotAvailableError extends ShopError {}
export class InsufficientStockError extends ShopError {}
export class InsufficientPointsError extends ShopError {}

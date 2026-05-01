export { prisma } from './lib/prisma'
export { getNextOrderNumber } from './lib/order-counter'
export { withPointsLock } from './lib/points-lock'
export type { PrismaClient } from './generated/prisma/client'

// Services
export {
  openShift,
  closeShift,
  generateShiftReport,
} from './lib/services/shift'

export {
  createOrder,
  addOrderItem,
  removeOrderItem,
  updateOrderItemQty,
  confirmOrder,
  payOrder,
  fulfillOrder,
  cancelOrder,
} from './lib/services/order'

export { applyDiscounts } from './lib/services/discount'

export { createReturn, applyReturn, cancelReturn } from './lib/services/return'

// Errors
export {
  ShopError,
  ShiftAlreadyOpenError,
  ShiftNotOpenError,
  OrderStateError,
  ProductNotAvailableError,
  InsufficientStockError,
  InsufficientPointsError,
  ReturnStateError,
  ExcessReturnQuantityError,
} from './lib/services/errors'

export { verifyCredentials } from './lib/auth'
export type { AuthUser } from './lib/auth'

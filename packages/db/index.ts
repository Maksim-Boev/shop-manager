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

export { verifyCredentials, hashPassword } from './lib/auth'
export type { AuthUser, JwtClaims, UserRole } from './lib/auth'

// Queries — Dashboard
export type {
  IDashboardKpis,
  IRevenueByHour,
  ITopShop,
  IActivityEvent,
  IAlert,
} from './lib/queries/dashboard'

export {
  getDashboardKpis,
  getRevenueByHour,
  getTopShops,
  getActivityFeed,
  getAlerts,
} from './lib/queries/dashboard'

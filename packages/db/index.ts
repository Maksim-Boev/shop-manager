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

// Utils
export type { TShopOpenStatus, TWeeklySchedule, IScheduleException } from './lib/utils/shop-status'
export { getShopOpenStatus } from './lib/utils/shop-status'

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

// Queries — Shops
export type { IShopWithStats } from './lib/queries/shops'
export { getShopsWithStats } from './lib/queries/shops'

// Queries — Shop Detail
export type {
  IShopOverview,
  ILowStockItem,
  IShiftMember,
  IStoreProductRow,
  IShopStaffMember,
  IAvailableUser,
  IClosedShift,
  IShopFinance,
  IShopMarginData,
  IScheduledShiftRow,
  IStoreUserOption,
  IStoreScheduleException,
  IStoreHoursConfig,
} from './lib/queries/shop-detail'

export {
  getShopOverview,
  getShopStock,
  getShopStaff,
  getAvailableStaffForShop,
  getShopFinance,
  getShopMargin,
  getShopSchedule,
  getStoreUsersForScheduling,
  getStoreHoursConfig,
} from './lib/queries/shop-detail'

// Queries — Staff
export type {
  IStaffMember,
  IStaffMemberDetail,
  ICurrentSalaryRate,
  ISalaryPayoutRow,
} from './lib/queries/staff'
export { getStaffList, getStaffMemberDetail } from './lib/queries/staff'

// Services — Staff
export {
  setUserStatusImpl,
  setUserSalaryImpl,
  setStoreAssignmentImpl,
  createStaffMemberImpl,
  deleteStaffMemberImpl,
} from './lib/services/staff'

// Queries — Warehouse
export type {
  IWarehouseStore,
  IWarehouseStockRow,
  IPurchaseOrderRow,
} from './lib/queries/warehouse'
export {
  getWarehouseStores,
  getWarehouseStock,
  getPendingPurchaseOrders,
} from './lib/queries/warehouse'

// Queries — Transfers
export type {
  ITransferRow,
  ITransferableStore,
  IStoreProductOption,
} from './lib/queries/transfers'
export {
  getTransfers,
  getTransferableStores,
  getStoreProductsForTransfer,
} from './lib/queries/transfers'

// Services — Transfer
export {
  createTransferImpl,
  completeTransferImpl,
  cancelTransferImpl,
} from './lib/services/transfer'

// Services — Scheduled Shifts
export {
  createScheduledShiftsImpl,
} from './lib/services/scheduled-shifts'
export type { ICreateScheduledShiftsInput } from './lib/services/scheduled-shifts'

// Services — Manual Adjustment
export { createManualAdjustmentImpl } from './lib/services/manual-adjustment'
export type { ICreateManualAdjustmentInput } from './lib/services/manual-adjustment'

// Queries — Products
export type {
  IProductRow,
  IProductDetail,
  IProductStoreRow,
  ICategoryWithSubs,
  ITaxRate,
} from './lib/queries/products'
export {
  getProducts,
  getProductDetail,
  getCategories,
  getTaxRates,
} from './lib/queries/products'

// Queries — Orders
export type {
  IOrderRow,
  IOrderDetail,
  IOrderItemRow,
  ICashierDayStats,
} from './lib/queries/orders'
export {
  getOrders,
  getOrderDetail,
  getRelatedOrders,
  getCashierDayStats,
} from './lib/queries/orders'

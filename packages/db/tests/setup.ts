import { afterAll, afterEach } from 'vitest'
import { prisma } from '../lib/prisma'
import { TEST_MARKER } from './helpers'

afterEach(async () => {
  const companies = await prisma.company.findMany({
    where: { name: { contains: TEST_MARKER } },
    select: { id: true },
  })
  if (companies.length === 0) return
  const ids = companies.map(c => c.id)

  // Удаляем в порядке зависимостей (дочерние → родительские).
  // Многие таблицы имеют companyId как plain string без FK, поэтому
  // CASCADE от Company до них не работает — чистим вручную.

  // 1. Движения склада и транзакции (листовые)
  await prisma.stockMovement.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.pointsTransaction.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.priceHistory.deleteMany({ where: { companyId: { in: ids } } })

  // 2. Дочерние записи документов
  await prisma.returnItem.deleteMany({ where: { return_: { companyId: { in: ids } } } })
  await prisma.orderItemDiscount.deleteMany({ where: { orderItem: { order: { companyId: { in: ids } } } } })
  await prisma.shiftReport.deleteMany({ where: { shift: { companyId: { in: ids } } } })
  await prisma.inventoryAuditItem.deleteMany({ where: { audit: { companyId: { in: ids } } } })
  await prisma.stockTransferItem.deleteMany({ where: { transfer: { companyId: { in: ids } } } })
  await prisma.goodsReceiptItem.deleteMany({ where: { goodsReceipt: { purchaseOrder: { companyId: { in: ids } } } } })
  await prisma.customerDiscountRule.deleteMany({ where: { customer: { companyId: { in: ids } } } })
  await prisma.customerContact.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.tierRule.deleteMany({ where: { tier: { companyId: { in: ids } } } })
  await prisma.promotionStore.deleteMany({ where: { promotion: { companyId: { in: ids } } } })
  await prisma.promotionTarget.deleteMany({ where: { promotion: { companyId: { in: ids } } } })
  await prisma.productBarcode.deleteMany({ where: { product: { companyId: { in: ids } } } })
  await prisma.productTag.deleteMany({ where: { product: { companyId: { in: ids } } } })
  await prisma.orderItem.deleteMany({ where: { order: { companyId: { in: ids } } } })
  await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { companyId: { in: ids } } } })

  // 3. Документы
  await prisma.return.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.order.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.shift.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.inventoryAudit.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.manualAdjustment.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.goodsReceipt.deleteMany({ where: { purchaseOrder: { companyId: { in: ids } } } })
  await prisma.purchaseOrder.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.stockTransfer.deleteMany({ where: { companyId: { in: ids } } })

  // 4. Клиенты и тиры
  await prisma.customer.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.tier.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.promotion.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.supplier.deleteMany({ where: { companyId: { in: ids } } })

  // 5. Каталог — сначала StoreProduct, потом Product, потом Category/TaxRate
  await prisma.storeProduct.deleteMany({ where: { store: { companyId: { in: ids } } } })
  await prisma.product.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.subcategory.deleteMany({ where: { category: { companyId: { in: ids } } } })
  await prisma.category.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.taxRate.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.tag.deleteMany({ where: { companyId: { in: ids } } })

  // 6. Store (FK: RESTRICT от Store к Company — должно быть последним перед Company)
  await prisma.store.deleteMany({ where: { companyId: { in: ids } } })

  // 7. User (FK: SET NULL) и Company
  await prisma.user.deleteMany({ where: { companyId: { in: ids } } })
  await prisma.company.deleteMany({ where: { id: { in: ids } } })
})

afterAll(async () => {
  await prisma.$disconnect()
})

import { prisma } from '../lib/prisma'

const SHOP_NAME = 'Промо-маркет Поділ'

const main = async () => {
  const company = await prisma.company.findFirst({ where: { name: 'Demo Co' } })
  if (!company) {
    console.error('Demo Co не знайдено — спочатку запустіть основний seed')
    return
  }

  const existing = await prisma.store.findFirst({
    where: { companyId: company.id, name: SHOP_NAME },
  })
  if (existing) {
    console.log(`seed: магазин "${SHOP_NAME}" вже існує (${existing.id}) — пропускаємо`)
    return
  }

  const cashier = await prisma.user.findFirst({
    where: { companyId: company.id, role: 'CASHIER' },
  })
  if (!cashier) {
    console.error('CASHIER не знайдений — створіть кориcтувача з роллю CASHIER')
    return
  }

  const products = await prisma.product.findMany({
    where: { companyId: company.id },
    orderBy: { sku: 'asc' },
    take: 7,
  })
  if (products.length < 4) {
    console.error('Недостатньо продуктів у Demo Co для створення замовлення')
    return
  }

  const tax = await prisma.taxRate.findFirst({
    where: { companyId: company.id, isDefault: true },
  })

  const shop = await prisma.store.create({
    data: {
      companyId: company.id,
      type: 'SHOP',
      name: SHOP_NAME,
      address: 'вул. Костянтинівська, 17',
      region: 'Київ',
      weeklySchedule: {
        days: [
          { day: 0, isOpen: true, from: '08:00', to: '22:00' },
          { day: 1, isOpen: true, from: '08:00', to: '22:00' },
          { day: 2, isOpen: true, from: '08:00', to: '22:00' },
          { day: 3, isOpen: true, from: '08:00', to: '22:00' },
          { day: 4, isOpen: true, from: '08:00', to: '22:00' },
          { day: 5, isOpen: true, from: '09:00', to: '21:00' },
          { day: 6, isOpen: true, from: '10:00', to: '20:00' },
        ],
      },
      enableFiscalReports: true,
    },
  })

  // stock distribution:
  //   2 products → stock=0    (out-of-stock)
  //   3 products → stock 1..9 (low-stock — попадає під фільтр lt: 10)
  //   решта     → stock 50..150 (норма)
  const STOCK_PLAN = [0, 0, 3, 5, 8, 80, 120]
  await prisma.storeProduct.createMany({
    data: products.map((p, i) => ({
      storeId: shop.id,
      productId: p.id,
      stock: STOCK_PLAN[i] ?? 60,
    })),
  })

  // Створюємо PAID-замовлення на сьогодні з позитивною виручкою.
  // Беремо кілька продуктів (НЕ ті, що з нульовим залишком).
  const orderItemSpecs = [
    { product: products[5], quantity: 3 },
    { product: products[6], quantity: 2 },
    { product: products[3], quantity: 4 },
  ].filter(s => s.product)

  const taxRateValue = tax ? Number(tax.rate) : 0.2

  const items = orderItemSpecs.map(s => {
    const price = Number(s.product.basePrice)
    const lineTotal = price * s.quantity
    return {
      productId: s.product.id,
      productNameSnapshot: s.product.name,
      unitSnapshot: s.product.unit,
      originalUnitPrice: price.toFixed(2),
      taxRateSnapshot: taxRateValue.toFixed(4),
      quantity: s.quantity.toFixed(3),
      lineTotal: lineTotal.toFixed(2),
    }
  })

  const subtotal = items.reduce((acc, it) => acc + Number(it.lineTotal), 0)
  const taxTotal = +(subtotal * taxRateValue).toFixed(2)
  const grandTotal = +(subtotal + taxTotal).toFixed(2)

  const now = new Date()

  const order = await prisma.order.create({
    data: {
      companyId: company.id,
      storeId: shop.id,
      orderNumber: 1,
      state: 'PAID',
      cashierUserId: cashier.id,
      deliveryType: 'PICKUP',
      deliveryStatus: 'NONE',
      subtotal: subtotal.toFixed(2),
      discountTotal: '0.00',
      taxTotal: taxTotal.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      paymentMethod: 'CARD',
      paidAmount: grandTotal.toFixed(2),
      paidAt: now,
      items: { create: items },
    },
  })

  console.log(
    `seed: shop=${shop.id} (${SHOP_NAME}), order=${order.id}, revenueToday=${grandTotal} грн, low-stock SKU=3, out-of-stock SKU=2`,
  )
}

main().finally(() => prisma.$disconnect())

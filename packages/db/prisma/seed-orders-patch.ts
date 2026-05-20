import { prisma } from '../lib/prisma'
import { getNextOrderNumber } from '../lib/order-counter'

const daysAgo = (n: number, hour = 12): Date => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, Math.floor(Math.random() * 60), 0, 0)
  return d
}

type TItemSpec = { sku: string; qty: string }
type TOrderSpec = {
  shopName: string
  state: 'PAID' | 'FULFILLED' | 'CANCELLED'
  payment: 'CASH' | 'CARD' | null
  daysBack: number
  hour: number
  items: TItemSpec[]
}

const ORDERS: TOrderSpec[] = [
  {
    shopName: 'АТБ Подільський', state: 'PAID', payment: 'CARD', daysBack: 1, hour: 10,
    items: [{ sku: 'MILK-1L', qty: '2' }, { sku: 'BREAD', qty: '1' }, { sku: 'EGGS-10', qty: '1' }],
  },
  {
    shopName: 'АТБ Подільський', state: 'PAID', payment: 'CASH', daysBack: 2, hour: 15,
    items: [{ sku: 'WATER-05', qty: '6' }, { sku: 'COFFEE', qty: '1' }],
  },
  {
    shopName: 'Сільпо Оболонь', state: 'FULFILLED', payment: 'CARD', daysBack: 0, hour: 9,
    items: [{ sku: 'SUGAR-1KG', qty: '2' }, { sku: 'OIL-1L', qty: '1' }, { sku: 'MILK-1L', qty: '3' }],
  },
  {
    shopName: 'Сільпо Оболонь', state: 'PAID', payment: 'CASH', daysBack: 0, hour: 17,
    items: [{ sku: 'BREAD', qty: '2' }, { sku: 'EGGS-10', qty: '2' }],
  },
  {
    shopName: 'Novus Хрещатик', state: 'CANCELLED', payment: null, daysBack: 1, hour: 13,
    items: [{ sku: 'COFFEE', qty: '1' }, { sku: 'OIL-1L', qty: '2' }],
  },
  {
    shopName: 'АТБ Личаків', state: 'PAID', payment: 'CARD', daysBack: 3, hour: 11,
    items: [{ sku: 'MILK-1L', qty: '1' }, { sku: 'WATER-05', qty: '4' }, { sku: 'SUGAR-1KG', qty: '1' }],
  },
  {
    shopName: 'Сільпо Стрийська', state: 'PAID', payment: 'CASH', daysBack: 0, hour: 18,
    items: [{ sku: 'EGGS-10', qty: '1' }, { sku: 'BREAD', qty: '3' }],
  },
  {
    shopName: 'Novus Одеса-Марина', state: 'FULFILLED', payment: 'CARD', daysBack: 2, hour: 14,
    items: [{ sku: 'COFFEE', qty: '2' }, { sku: 'MILK-1L', qty: '1' }, { sku: 'OIL-1L', qty: '1' }],
  },
]

const main = async () => {
  const company = await prisma.company.findFirst({ where: { name: 'Demo Co' } })
  if (!company) {
    console.error('Demo Co не знайдено — спочатку запустіть основний seed')
    return
  }

  const existing = await prisma.order.count({ where: { companyId: company.id } })
  if (existing > 0) {
    console.log(`seed-orders: вже є ${existing} замовлень — пропускаємо`)
    return
  }

  const cashier = await prisma.user.findFirst({
    where: { companyId: company.id, role: 'CASHIER' },
  })
  if (!cashier) {
    console.error('Касир не знайдений — спочатку запустіть основний seed')
    return
  }

  const stores = await prisma.store.findMany({
    where: { companyId: company.id, type: 'SHOP' },
    select: { id: true, name: true },
  })
  const storeMap = new Map(stores.map(s => [s.name, s.id]))

  const products = await prisma.product.findMany({
    where: { companyId: company.id },
    include: { taxRate: true },
  })
  const productMap = new Map(products.map(p => [p.sku, p]))

  let created = 0

  for (const spec of ORDERS) {
    const storeId = storeMap.get(spec.shopName)
    if (!storeId) {
      console.warn(`Магазин "${spec.shopName}" не знайдено — пропускаємо`)
      continue
    }

    const resolvedItems = spec.items.flatMap(item => {
      const p = productMap.get(item.sku)
      if (!p) { console.warn(`  SKU "${item.sku}" не знайдено — пропускаємо`); return [] }
      return [{ product: p, qty: item.qty }]
    })
    if (resolvedItems.length === 0) continue

    const createdAt = daysAgo(spec.daysBack, spec.hour)
    const isPaid = spec.state === 'PAID' || spec.state === 'FULFILLED'
    const paidAt = isPaid ? new Date(createdAt.getTime() + 120_000) : null

    let subtotal = 0
    const itemsData = resolvedItems.map(({ product, qty }) => {
      const price = parseFloat(product.basePrice.toString())
      const q = parseFloat(qty)
      const lineTotal = +(price * q).toFixed(2)
      subtotal += lineTotal
      return {
        productId: product.id,
        productNameSnapshot: product.name,
        unitSnapshot: product.unit,
        originalUnitPrice: price.toFixed(2),
        taxRateSnapshot: product.taxRate.rate.toString(),
        quantity: qty,
        discountTotal: '0.00',
        lineTotal: lineTotal.toFixed(2),
      }
    })
    const taxTotal = +(subtotal * (0.2 / 1.2)).toFixed(2)

    await prisma.$transaction(async tx => {
      const orderNumber = await getNextOrderNumber(tx, storeId)
      await tx.order.create({
        data: {
          companyId: company.id,
          storeId,
          orderNumber,
          state: spec.state,
          cashierUserId: cashier.id,
          paymentMethod: spec.payment,
          paidAmount: isPaid ? subtotal.toFixed(2) : null,
          paidAt,
          subtotal: subtotal.toFixed(2),
          discountTotal: '0.00',
          taxTotal: taxTotal.toFixed(2),
          grandTotal: subtotal.toFixed(2),
          createdAt,
          items: { create: itemsData },
        },
      })
    })

    created++
    console.log(`  ✓ ${spec.shopName} — ${spec.state} (${subtotal.toFixed(2)} грн.)`)
  }

  console.log(`seed-orders: створено ${created} замовлень`)
}

main().finally(() => prisma.$disconnect())

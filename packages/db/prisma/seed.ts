import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

const main = async () => {
  const existing = await prisma.company.findFirst({ where: { name: 'Demo Co' } })
  if (existing) {
    console.log('seed: Demo Co уже есть, пропускаем')
    return
  }

  const company = await prisma.company.create({
    data: {
      name: 'Demo Co',
      tierAssignmentMode: 'CUMULATIVE_LIFETIME',
      pointsEarnPercent: '0.0100',
      pointsRedemptionRate: '0.0100',
      pointsExpiryMode: 'NEVER',
      maxPromotionPercent: '50',
      maxTierPercent: '30',
      maxCustomerRulePercent: '30',
      maxTotalDiscountPercent: '70',
    },
  })

  const PASSWORD_HASH = await bcrypt.hash('password123', 10)

  const [admin] = await Promise.all([
    prisma.user.create({
      data: {
        companyId: company.id,
        email: 'admin@test.com',
        passwordHash: PASSWORD_HASH,
        firstName: 'Адмін',
        lastName: 'Тестовий',
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        email: 'manager@test.com',
        passwordHash: PASSWORD_HASH,
        firstName: 'Менеджер',
        lastName: 'Тестовий',
        role: 'MANAGER',
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        email: 'cashier@test.com',
        passwordHash: PASSWORD_HASH,
        firstName: 'Касир',
        lastName: 'Тестовий',
        role: 'CASHIER',
      },
    }),
  ])

  const [shop, warehouse] = await Promise.all([
    prisma.store.create({
      data: {
        companyId: company.id,
        type: 'SHOP',
        name: 'Магазин 1',
        enableFiscalReports: true,
      },
    }),
    prisma.store.create({
      data: { companyId: company.id, type: 'WAREHOUSE', name: 'Центральный склад' },
    }),
  ])

  const tax = await prisma.taxRate.create({
    data: { companyId: company.id, name: 'НДС 20%', rate: '0.2000', isDefault: true },
  })

  const category = await prisma.category.create({
    data: { companyId: company.id, name: 'Напитки' },
  })

  const products = await Promise.all(
    [
      { sku: 'MILK-1L', name: 'Молоко 1л', unit: 'LITER' as const, basePrice: '89.00' },
      { sku: 'BREAD', name: 'Хлеб белый', unit: 'PIECE' as const, basePrice: '45.00' },
      { sku: 'SUGAR-1KG', name: 'Сахар 1кг', unit: 'KG' as const, basePrice: '75.00' },
      { sku: 'WATER-05', name: 'Вода 0.5л', unit: 'LITER' as const, basePrice: '35.00' },
      { sku: 'COFFEE', name: 'Кофе растворимый', unit: 'PACK' as const, basePrice: '299.00' },
    ].map((p, i) =>
      prisma.product.create({
        data: {
          companyId: company.id,
          sku: p.sku,
          name: p.name,
          unit: p.unit,
          basePrice: p.basePrice,
          categoryId: category.id,
          taxRateId: tax.id,
          barcodes: {
            create: [{ barcode: `200000${i.toString().padStart(4, '0')}`, isPrimary: true }],
          },
        },
      }),
    ),
  )

  await prisma.tier.createMany({
    data: [
      { companyId: company.id, name: 'Silver', level: 1, entryThreshold: '1000' },
      { companyId: company.id, name: 'Gold', level: 2, entryThreshold: '5000' },
      { companyId: company.id, name: 'Platinum', level: 3, entryThreshold: '20000' },
    ],
  })

  const customer = await prisma.customer.create({
    data: {
      companyId: company.id,
      firstName: 'Иван',
      lastName: 'Иванов',
      contacts: {
        create: [
          { type: 'PHONE', value: '+79001234567', companyId: company.id, isPrimary: true },
        ],
      },
    },
  })

  await prisma.promotion.create({
    data: {
      companyId: company.id,
      name: '-10% на напитки',
      status: 'ACTIVE',
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31'),
      actionType: 'PERCENT',
      actionValue: '10',
      targets: { create: [{ targetType: 'CATEGORY', targetId: category.id }] },
    },
  })

  console.log(
    `seed: company=${company.id}, admin=${admin.id}, shop=${shop.id}, warehouse=${warehouse.id}, products=${products.length}, customer=${customer.id}`,
  )
}

main().finally(() => prisma.$disconnect())

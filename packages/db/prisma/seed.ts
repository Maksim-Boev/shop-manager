import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

const SHOPS = [
  {
    name: 'АТБ Подільський',
    address: 'вул. Межигірська, 82',
    region: 'Київ',
    openingHours: '08:00 – 22:00',
  },
  {
    name: 'Сільпо Оболонь',
    address: 'просп. Оболонський, 25',
    region: 'Київ',
    openingHours: '07:00 – 23:00',
  },
  {
    name: 'Novus Хрещатик',
    address: 'вул. Хрещатик, 44',
    region: 'Київ',
    openingHours: '08:00 – 22:00',
  },
  {
    name: 'АТБ Личаків',
    address: 'вул. Личаківська, 115',
    region: 'Львів',
    openingHours: '08:00 – 22:00',
  },
  {
    name: 'Сільпо Стрийська',
    address: 'вул. Стрийська, 30',
    region: 'Львів',
    openingHours: '08:00 – 22:00',
  },
  {
    name: 'Novus Одеса-Марина',
    address: 'вул. Катерининська, 14',
    region: 'Одеса',
    openingHours: '00:00 – 24:00',
  },
]

const main = async () => {
  const existing = await prisma.company.findFirst({ where: { name: 'Demo Co' } })
  if (existing) {
    console.log('seed: Demo Co вже є, пропускаємо')
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

  const shops = await Promise.all(
    SHOPS.map(s =>
      prisma.store.create({
        data: {
          companyId: company.id,
          type: 'SHOP',
          name: s.name,
          address: s.address,
          region: s.region,
          openingHours: s.openingHours,
          enableFiscalReports: true,
        },
      }),
    ),
  )

  const warehouse = await prisma.store.create({
    data: { companyId: company.id, type: 'WAREHOUSE', name: 'Центральний склад' },
  })

  const tax = await prisma.taxRate.create({
    data: { companyId: company.id, name: 'ПДВ 20%', rate: '0.2000', isDefault: true },
  })

  const category = await prisma.category.create({
    data: { companyId: company.id, name: 'Напої' },
  })

  const products = await Promise.all(
    [
      { sku: 'MILK-1L',   name: 'Молоко 1л',           unit: 'LITER' as const, basePrice: '89.00'  },
      { sku: 'BREAD',     name: 'Хліб білий',           unit: 'PIECE' as const, basePrice: '45.00'  },
      { sku: 'SUGAR-1KG', name: 'Цукор 1кг',            unit: 'KG'    as const, basePrice: '75.00'  },
      { sku: 'WATER-05',  name: 'Вода 0.5л',            unit: 'LITER' as const, basePrice: '35.00'  },
      { sku: 'COFFEE',    name: 'Кава розчинна',        unit: 'PACK'  as const, basePrice: '299.00' },
      { sku: 'EGGS-10',   name: 'Яйця 10шт',            unit: 'PIECE' as const, basePrice: '120.00' },
      { sku: 'OIL-1L',    name: 'Олія соняшникова 1л',  unit: 'LITER' as const, basePrice: '95.00'  },
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

  // Stock for each shop
  for (const shop of shops) {
    await prisma.storeProduct.createMany({
      data: products.map(p => ({
        storeId: shop.id,
        productId: p.id,
        stock: Math.floor(Math.random() * 200) + 10,
      })),
    })
  }

  await prisma.tier.createMany({
    data: [
      { companyId: company.id, name: 'Silver',   level: 1, entryThreshold: '1000'  },
      { companyId: company.id, name: 'Gold',     level: 2, entryThreshold: '5000'  },
      { companyId: company.id, name: 'Platinum', level: 3, entryThreshold: '20000' },
    ],
  })

  const customer = await prisma.customer.create({
    data: {
      companyId: company.id,
      firstName: 'Іван',
      lastName: 'Іванов',
      contacts: {
        create: [
          { type: 'PHONE', value: '+380501234567', companyId: company.id, isPrimary: true },
        ],
      },
    },
  })

  await prisma.promotion.create({
    data: {
      companyId: company.id,
      name: '-10% на напої',
      status: 'ACTIVE',
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31'),
      actionType: 'PERCENT',
      actionValue: '10',
      targets: { create: [{ targetType: 'CATEGORY', targetId: category.id }] },
    },
  })

  console.log(
    `seed: company=${company.id}, admin=${admin.id}, shops=${shops.length}, warehouse=${warehouse.id}, products=${products.length}, customer=${customer.id}`,
  )
}

main().finally(() => prisma.$disconnect())

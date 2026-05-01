import type { Order, PrismaClient } from '../../generated/prisma/client'
import { Prisma } from '../../generated/prisma/client'
import { InsufficientPointsError, OrderStateError } from './errors'

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]
const D = Prisma.Decimal

// ─── private helpers ──────────────────────────────────────────────────────────

const _collapseBogoItems = async (tx: Tx, orderId: string): Promise<void> => {
  const bogoItems = await tx.orderItem.findMany({
    where: { orderId, sourcePromotionId: { not: null } },
  })
  for (const bogoItem of bogoItems) {
    const parent = await tx.orderItem.findFirst({
      where: { orderId, productId: bogoItem.productId, sourcePromotionId: null },
    })
    if (parent) {
      const newQty = new D(parent.quantity).add(new D(bogoItem.quantity))
      await tx.orderItem.update({
        where: { id: parent.id },
        data: { quantity: newQty.toFixed(3) },
      })
    }
    await tx.orderItem.delete({ where: { id: bogoItem.id } })
  }
}

const _promoMatchesItem = (
  targets: Array<{ targetType: string; targetId: string | null }>,
  item: { productId: string },
  product: { categoryId: string; subcategoryId: string | null; tags: Array<{ tagId: string }> },
): boolean => {
  for (const t of targets) {
    if (t.targetType === 'ALL') return true
    if (t.targetType === 'PRODUCT' && t.targetId === item.productId) return true
    if (t.targetType === 'CATEGORY' && t.targetId === product.categoryId) return true
    if (t.targetType === 'SUBCATEGORY' && product.subcategoryId && t.targetId === product.subcategoryId) return true
    if (t.targetType === 'TAG' && product.tags.some(tg => tg.tagId === t.targetId)) return true
  }
  return false
}

const _calcNonBogoPromoDiscount = (
  promo: { actionType: string; actionValue: Prisma.Decimal; bogoGetDiscountPercent?: Prisma.Decimal | null },
  item: { quantity: Prisma.Decimal | string },
  gross: Prisma.Decimal,
): Prisma.Decimal => {
  if (promo.actionType === 'PERCENT') {
    return gross.mul(new D(promo.actionValue)).div(100).toDecimalPlaces(2, 4)
  }
  if (promo.actionType === 'FIXED_AMOUNT') {
    const val = new D(promo.actionValue)
    return val.lt(gross) ? val : gross
  }
  if (promo.actionType === 'FIXED_PRICE') {
    const target = new D(promo.actionValue).mul(new D(item.quantity))
    const diff = gross.sub(target)
    return diff.gt(0) ? diff : new D('0')
  }
  return new D('0')
}

const SCOPE_PRIORITY: Record<string, number> = {
  PRODUCT: 5, SUBCATEGORY: 4, CATEGORY: 3, TAG: 2, WHOLE_ORDER: 1,
}

const _ruleMatchesItem = (
  rule: { scope: string; targetId: string | null },
  item: { productId: string },
  product: { categoryId: string; subcategoryId: string | null; tags: Array<{ tagId: string }> },
): boolean => {
  if (rule.scope === 'WHOLE_ORDER') return true
  if (rule.scope === 'PRODUCT') return rule.targetId === item.productId
  if (rule.scope === 'CATEGORY') return rule.targetId === product.categoryId
  if (rule.scope === 'SUBCATEGORY') return rule.targetId === product.subcategoryId
  if (rule.scope === 'TAG') return product.tags.some(t => t.tagId === rule.targetId)
  return false
}

type LoyaltyMatch = {
  rule: { discountPercent: Prisma.Decimal | null; discountAmount: Prisma.Decimal | null; scope: string }
  sourceType: 'TIER' | 'CUSTOMER_RULE'
  sourceId: string
}

const _findBestLoyaltyRule = (
  tierRules: Array<{ id: string; tierId: string; scope: string; targetId: string | null; discountPercent: Prisma.Decimal | null; discountAmount: Prisma.Decimal | null }>,
  customerRules: Array<{ id: string; scope: string; targetId: string | null; discountPercent: Prisma.Decimal | null; discountAmount: Prisma.Decimal | null }>,
  item: { productId: string },
  product: { categoryId: string; subcategoryId: string | null; tags: Array<{ tagId: string }> },
): LoyaltyMatch | null => {
  type Candidate = { priority: number; sourceType: 'TIER' | 'CUSTOMER_RULE'; rule: LoyaltyMatch['rule']; sourceId: string }
  const candidates: Candidate[] = []

  for (const r of tierRules) {
    if (_ruleMatchesItem(r, item, product))
      candidates.push({ priority: SCOPE_PRIORITY[r.scope] ?? 0, sourceType: 'TIER', rule: r, sourceId: r.tierId })
  }
  for (const r of customerRules) {
    if (_ruleMatchesItem(r, item, product))
      candidates.push({ priority: SCOPE_PRIORITY[r.scope] ?? 0, sourceType: 'CUSTOMER_RULE', rule: r, sourceId: r.id })
  }

  if (candidates.length === 0) return null

  let best = candidates[0]
  for (const c of candidates.slice(1)) {
    if (c.priority > best.priority || (c.priority === best.priority && c.sourceType === 'CUSTOMER_RULE')) {
      best = c
    }
  }

  return { rule: best.rule, sourceType: best.sourceType, sourceId: best.sourceId }
}

const _calcRuleDiscount = (
  rule: { discountPercent: Prisma.Decimal | null; discountAmount: Prisma.Decimal | null },
  gross: Prisma.Decimal,
): Prisma.Decimal => {
  if (rule.discountPercent !== null) {
    return gross.mul(new D(rule.discountPercent)).div(100).toDecimalPlaces(2, 4)
  }
  if (rule.discountAmount !== null) {
    const val = new D(rule.discountAmount)
    return val.lt(gross) ? val : gross
  }
  return new D('0')
}

const _hareDistribute = (total: Prisma.Decimal, weights: Prisma.Decimal[], totalWeight: Prisma.Decimal): Prisma.Decimal[] => {
  if (total.lte(0) || totalWeight.lte(0)) return weights.map(() => new D('0'))
  const rawShares = weights.map(w => total.mul(w).div(totalWeight))
  const floorShares = rawShares.map(r => r.mul(100).floor().div(100))
  const sumFloor = floorShares.reduce((s, f) => s.add(f), new D('0'))
  const remainderCents = total.sub(sumFloor).mul(100).round().toNumber()
  const fractions = rawShares.map((r, i) => ({ i, frac: r.sub(floorShares[i]) }))
  fractions.sort((a, b) => {
    const d = b.frac.comparedTo(a.frac)
    return d !== 0 ? d : a.i - b.i
  })
  const result = [...floorShares]
  for (let j = 0; j < remainderCents; j++) result[fractions[j].i] = result[fractions[j].i].add(new D('0.01'))
  return result
}

const _recalcInTx = async (tx: Tx, orderId: string): Promise<void> => {
  const items = await tx.orderItem.findMany({ where: { orderId } })
  let subtotal = new D('0')
  let discountTotal = new D('0')
  let taxTotal = new D('0')
  for (const item of items) {
    subtotal = subtotal.add(new D(item.originalUnitPrice).mul(item.quantity))
    discountTotal = discountTotal.add(item.discountTotal)
    const lineTotal = new D(item.lineTotal)
    const rate = new D(item.taxRateSnapshot)
    taxTotal = taxTotal.add(lineTotal.sub(lineTotal.div(rate.add(1))).toDecimalPlaces(2, 4))
  }
  await tx.order.update({
    where: { id: orderId },
    data: {
      subtotal: subtotal.toFixed(2),
      discountTotal: discountTotal.toFixed(2),
      taxTotal: taxTotal.toFixed(2),
      grandTotal: subtotal.sub(discountTotal).toFixed(2),
    },
  })
}

// ─── public ───────────────────────────────────────────────────────────────────

export const applyDiscountsInTx = async (
  tx: Tx,
  orderId: string,
  pointsToRedeem: number,
  now = new Date(),
): Promise<void> => {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } })
  if (!['DRAFT', 'PENDING'].includes(order.state)) {
    throw new OrderStateError(`cannot apply discounts to order in state ${order.state}`)
  }

  // 1. Collapse existing BOGO splits
  await _collapseBogoItems(tx, orderId)

  // 2. Reset: clear discounts and set lineTotal = gross for all items
  let items = await tx.orderItem.findMany({ where: { orderId } })
  if (items.length === 0) return

  await tx.orderItemDiscount.deleteMany({ where: { orderItemId: { in: items.map(i => i.id) } } })
  for (const item of items) {
    const gross = new D(item.originalUnitPrice).mul(item.quantity)
    await tx.orderItem.update({
      where: { id: item.id },
      data: { discountTotal: '0.00', lineTotal: gross.toFixed(2) },
    })
  }

  // 3. Load company settings
  const company = await tx.company.findUniqueOrThrow({ where: { id: order.companyId } })

  // 4. Load customer, loyalty rules, tier level
  let tierRules: Array<{ id: string; tierId: string; scope: string; targetId: string | null; discountPercent: Prisma.Decimal | null; discountAmount: Prisma.Decimal | null }> = []
  let customerRules: Array<{ id: string; scope: string; targetId: string | null; discountPercent: Prisma.Decimal | null; discountAmount: Prisma.Decimal | null }> = []
  let customerTierLevel: number | null = null

  if (order.customerId) {
    const customer = await tx.customer.findUnique({
      where: { id: order.customerId },
      include: { tier: { include: { rules: true } } },
    })
    if (customer?.tier) {
      tierRules = customer.tier.rules
      customerTierLevel = customer.tier.level
    }

    customerRules = await tx.customerDiscountRule.findMany({
      where: {
        customerId: order.customerId,
        OR: [{ validFrom: null }, { validFrom: { lte: now } }],
        AND: [{ OR: [{ validTo: null }, { validTo: { gte: now } }] }],
      },
    })
  }

  // 5. Load eligible promotions
  const nowDow = now.getDay()
  const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const allPromos = await tx.promotion.findMany({
    where: {
      companyId: order.companyId,
      status: 'ACTIVE',
      validFrom: { lte: now },
      validTo: { gte: now },
      OR: [
        { stores: { none: {} } },
        { stores: { some: { storeId: order.storeId } } },
      ],
    },
    include: { targets: true, stores: true },
    orderBy: { priority: 'desc' },
  })

  const promos = allPromos.filter(p => {
    if (p.requiresCustomer && !order.customerId) return false
    if (p.cartMinSubtotal !== null && new D(order.subtotal).lt(p.cartMinSubtotal)) return false
    if (p.cartMinQuantity !== null) {
      const totalQty = items.reduce((sum, i) => sum.add(new D(i.quantity)), new D('0'))
      if (totalQty.lt(p.cartMinQuantity)) return false
    }
    if (p.dayOfWeekMask.length > 0 && !p.dayOfWeekMask.includes(nowDow)) return false
    if (p.timeOfDayFrom && p.timeOfDayTo && (nowTime < p.timeOfDayFrom || nowTime > p.timeOfDayTo)) return false
    return true
  })

  // minApplicableTierLevel is checked against customer tier below in the per-item loop
  const bogoPromos = promos.filter(p => p.actionType === 'BOGO')
  const nonBogoPromos = promos.filter(p => p.actionType !== 'BOGO')

  // 6. Load product info for items
  const productIds = [...new Set(items.map(i => i.productId))]
  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    include: { tags: true },
  })
  const productMap = new Map(products.map(p => [p.id, p]))

  const promoEligibleFor = (p: typeof promos[0]) => {
    if (p.minApplicableTierLevel !== null) {
      if (customerTierLevel === null || customerTierLevel < p.minApplicableTierLevel) return false
    }
    return true
  }

  // 8. Apply BOGO splits
  for (const promo of bogoPromos) {
    if (!promoEligibleFor(promo)) continue
    const triggerQty = promo.bogoTriggerQty ?? 1
    const getQty = promo.bogoGetQty ?? 1
    const getDiscPct = promo.bogoGetDiscountPercent ?? new D('0')

    for (const item of items) {
      if (item.sourcePromotionId) continue
      const product = productMap.get(item.productId)
      if (!product || !_promoMatchesItem(promo.targets, item, product)) continue

      const qty = new D(item.quantity)
      const sets = qty.div(triggerQty + getQty).floor().toNumber()
      if (sets <= 0) continue

      const prizeQty = new D(sets * getQty)
      const triggerQtyOnly = qty.sub(prizeQty)
      const unitPrice = new D(item.originalUnitPrice)
      const prizeGross = unitPrice.mul(prizeQty)
      const bogoDiscount = prizeGross.mul(getDiscPct).div(100).toDecimalPlaces(2, 4)

      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          quantity: triggerQtyOnly.toFixed(3),
          lineTotal: unitPrice.mul(triggerQtyOnly).toFixed(2),
        },
      })

      const prizeItem = await tx.orderItem.create({
        data: {
          orderId,
          productId: item.productId,
          productNameSnapshot: item.productNameSnapshot,
          unitSnapshot: item.unitSnapshot,
          originalUnitPrice: item.originalUnitPrice,
          taxRateSnapshot: item.taxRateSnapshot,
          quantity: prizeQty.toFixed(3),
          discountTotal: bogoDiscount.toFixed(2),
          lineTotal: prizeGross.sub(bogoDiscount).toFixed(2),
          sourcePromotionId: promo.id,
        },
      })

      await tx.orderItemDiscount.create({
        data: {
          orderItemId: prizeItem.id,
          sourceType: 'PROMOTION',
          sourceId: promo.id,
          appliedPercent: getDiscPct,
          appliedAmount: bogoDiscount.toFixed(2),
        },
      })
    }
  }

  // 9. Re-read items (now includes prize items)
  items = await tx.orderItem.findMany({ where: { orderId } })

  // 10. Apply non-BOGO promo + loyalty discounts per item
  for (const item of items) {
    const product = productMap.get(item.productId)
    if (!product) continue

    const gross = new D(item.originalUnitPrice).mul(item.quantity)
    const globalMax = gross.mul(new D(company.maxTotalDiscountPercent)).div(100)

    // Existing BOGO discount on prize items counts toward promo cap
    const existingPromoAgg = await tx.orderItemDiscount.aggregate({
      where: { orderItemId: item.id, sourceType: 'PROMOTION' },
      _sum: { appliedAmount: true },
    })
    const alreadyPromo = new D(existingPromoAgg._sum.appliedAmount ?? '0')
    const promoMaxCap = gross.mul(new D(company.maxPromotionPercent)).div(100)
    const promoHeadroom = promoMaxCap.sub(alreadyPromo).gt(0) ? promoMaxCap.sub(alreadyPromo) : new D('0')
    const globalHeadroomAfterBogo = globalMax.sub(alreadyPromo).gt(0) ? globalMax.sub(alreadyPromo) : new D('0')

    // Compute raw non-BOGO promo discounts
    const matches: Array<{ promoId: string; amount: Prisma.Decimal; actionType: string; actionValue: Prisma.Decimal }> = []
    let rawNonBogoTotal = new D('0')
    for (const promo of nonBogoPromos) {
      if (!promoEligibleFor(promo)) continue
      if (!_promoMatchesItem(promo.targets, item, product)) continue
      const raw = _calcNonBogoPromoDiscount(promo, item, gross)
      if (raw.gt(0)) {
        matches.push({ promoId: promo.id, amount: raw, actionType: promo.actionType, actionValue: promo.actionValue })
        rawNonBogoTotal = rawNonBogoTotal.add(raw)
      }
    }

    // PERCENT promos: capped by maxPromotionPercent (promoHeadroom) and global cap
    const percentMatches = matches.filter(m => m.actionType === 'PERCENT')
    const fixedMatches = matches.filter(m => m.actionType !== 'PERCENT')

    const rawPercentTotal = percentMatches.reduce((s, m) => s.add(m.amount), new D('0'))
    const percentCapSpace = promoHeadroom.lt(globalHeadroomAfterBogo) ? promoHeadroom : globalHeadroomAfterBogo
    const actualPercent = rawPercentTotal.lt(percentCapSpace) ? rawPercentTotal : percentCapSpace
    const percentScale = rawPercentTotal.gt(0) ? actualPercent.div(rawPercentTotal) : new D('0')

    // FIXED_AMOUNT / FIXED_PRICE: no percentage cap — already capped at gross in _calcNonBogoPromoDiscount
    const rawFixedTotal = fixedMatches.reduce((s, m) => s.add(m.amount), new D('0'))

    let totalPromoForItem = alreadyPromo.add(actualPercent).add(rawFixedTotal)

    for (const match of percentMatches) {
      const scaled = match.amount.mul(percentScale).toDecimalPlaces(2, 4)
      if (scaled.lte(0)) continue
      await tx.orderItemDiscount.create({
        data: {
          orderItemId: item.id,
          sourceType: 'PROMOTION',
          sourceId: match.promoId,
          appliedPercent: match.actionValue,
          appliedAmount: scaled.toFixed(2),
        },
      })
    }

    for (const match of fixedMatches) {
      if (match.amount.lte(0)) continue
      await tx.orderItemDiscount.create({
        data: {
          orderItemId: item.id,
          sourceType: 'PROMOTION',
          sourceId: match.promoId,
          appliedPercent: null,
          appliedAmount: match.amount.toFixed(2),
        },
      })
    }

    // Loyalty rule
    let globalRemaining = globalMax.sub(totalPromoForItem).gt(0) ? globalMax.sub(totalPromoForItem) : new D('0')
    let loyaltyActual = new D('0')
    const bestRule = _findBestLoyaltyRule(tierRules, customerRules, item, product)
    if (bestRule) {
      const loyaltyCap = bestRule.sourceType === 'TIER'
        ? gross.mul(new D(company.maxTierPercent)).div(100)
        : gross.mul(new D(company.maxCustomerRulePercent)).div(100)
      const rawLoyalty = _calcRuleDiscount(bestRule.rule, gross)
      const cappedLoyalty = rawLoyalty.lt(loyaltyCap) ? rawLoyalty : loyaltyCap
      loyaltyActual = cappedLoyalty.lt(globalRemaining) ? cappedLoyalty : globalRemaining
      globalRemaining = globalRemaining.sub(loyaltyActual)

      if (loyaltyActual.gt(0)) {
        await tx.orderItemDiscount.create({
          data: {
            orderItemId: item.id,
            sourceType: bestRule.sourceType,
            sourceId: bestRule.sourceId,
            appliedPercent: bestRule.rule.discountPercent,
            appliedAmount: loyaltyActual.toFixed(2),
          },
        })
      }
    }

    const nonPointsTotal = totalPromoForItem.add(loyaltyActual)
    await tx.orderItem.update({
      where: { id: item.id },
      data: {
        discountTotal: nonPointsTotal.toFixed(2),
        lineTotal: gross.sub(nonPointsTotal).toFixed(2),
      },
    })
  }

  // 11. POINTS distribution
  if (pointsToRedeem > 0 && order.customerId) {
    const customer = await tx.customer.findUniqueOrThrow({ where: { id: order.customerId } })
    if (customer.pointsBalance < pointsToRedeem) {
      throw new InsufficientPointsError('insufficient points balance')
    }

    const budget = new D(pointsToRedeem).mul(company.pointsRedemptionRate)
    const currentItems = await tx.orderItem.findMany({ where: { orderId } })
    const grossValues = currentItems.map(i => new D(i.originalUnitPrice).mul(i.quantity))
    const totalGross = grossValues.reduce((s, g) => s.add(g), new D('0'))

    if (totalGross.gt(0)) {
      const shares = _hareDistribute(budget, grossValues, totalGross)
      for (let i = 0; i < currentItems.length; i++) {
        const item = currentItems[i]
        const gross = grossValues[i]
        const globalMax = gross.mul(new D(company.maxTotalDiscountPercent)).div(100)
        const currentDiscount = new D(item.discountTotal)
        const headroom = globalMax.sub(currentDiscount).gt(0) ? globalMax.sub(currentDiscount) : new D('0')
        const pointsShare = shares[i].lt(headroom) ? shares[i] : headroom
        if (pointsShare.lte(0)) continue

        await tx.orderItemDiscount.create({
          data: {
            orderItemId: item.id,
            sourceType: 'POINTS',
            sourceId: orderId,
            appliedAmount: pointsShare.toFixed(2),
          },
        })
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            discountTotal: currentDiscount.add(pointsShare).toFixed(2),
            lineTotal: gross.sub(currentDiscount).sub(pointsShare).toFixed(2),
          },
        })
      }
    }
  }

  // 12. Recalculate order totals
  await _recalcInTx(tx, orderId)
}

export const applyDiscounts = async (
  db: PrismaClient,
  params: { orderId: string; pointsToRedeem?: number },
): Promise<Order> =>
  db.$transaction(async tx => {
    await applyDiscountsInTx(tx, params.orderId, params.pointsToRedeem ?? 0)
    return tx.order.findUniqueOrThrow({ where: { id: params.orderId } })
  })

import { describe, it, expect } from 'vitest'
import { getShopOpenStatus } from '../../lib/utils/shop-status'
import type { TWeeklySchedule, IScheduleException } from '../../lib/utils/shop-status'

const makeAllOpen = (from: string, to: string): TWeeklySchedule => ({
  days: ([0, 1, 2, 3, 4, 5, 6] as const).map(day => ({ day, isOpen: true, from, to })),
})

const at = (isoDate: string, h: number, m = 0): Date => {
  const d = new Date(`${isoDate}T00:00:00`)
  d.setHours(h, m, 0, 0)
  return d
}

// 2026-05-04 = Monday (getDay()=1, isoDay=0)
const MON = '2026-05-04'
// 2026-05-10 = Sunday (getDay()=0, isoDay=6)
const SUN = '2026-05-10'

describe('getShopOpenStatus', () => {
  it('returns unknown when weeklySchedule is null', () => {
    expect(getShopOpenStatus(null, [], new Date())).toBe('unknown')
  })

  it('returns open within working hours', () => {
    const s = makeAllOpen('09:00', '21:00')
    expect(getShopOpenStatus(s, [], at(MON, 10))).toBe('open')
    expect(getShopOpenStatus(s, [], at(MON, 9, 0))).toBe('open')
    expect(getShopOpenStatus(s, [], at(MON, 20, 59))).toBe('open')
  })

  it('returns closed outside working hours', () => {
    const s = makeAllOpen('09:00', '21:00')
    expect(getShopOpenStatus(s, [], at(MON, 8, 59))).toBe('closed')
    expect(getShopOpenStatus(s, [], at(MON, 21, 0))).toBe('closed')
  })

  it('returns closed on a day marked isOpen=false', () => {
    const s: TWeeklySchedule = {
      days: ([0, 1, 2, 3, 4, 5, 6] as const).map(day => ({
        day,
        isOpen: day !== 6,
        ...(day !== 6 && { from: '09:00', to: '21:00' }),
      })),
    }
    expect(getShopOpenStatus(s, [], at(SUN, 12))).toBe('closed')
  })

  it('exact-year exception overrides weekly — closed', () => {
    const s = makeAllOpen('09:00', '21:00')
    const exc: IScheduleException = { year: 2026, month: 5, day: 4, isOpen: false, from: null, to: null }
    expect(getShopOpenStatus(s, [exc], at(MON, 12))).toBe('closed')
  })

  it('annual exception overrides weekly — short hours open', () => {
    const s = makeAllOpen('09:00', '21:00')
    const exc: IScheduleException = { year: null, month: 5, day: 4, isOpen: true, from: '10:00', to: '14:00' }
    expect(getShopOpenStatus(s, [exc], at(MON, 12))).toBe('open')
    expect(getShopOpenStatus(s, [exc], at(MON, 14))).toBe('closed')
    expect(getShopOpenStatus(s, [exc], at(MON, 9))).toBe('closed')
  })

  it('annual exception overrides weekly — closed', () => {
    const s = makeAllOpen('09:00', '21:00')
    const exc: IScheduleException = { year: null, month: 5, day: 4, isOpen: false, from: null, to: null }
    expect(getShopOpenStatus(s, [exc], at(MON, 12))).toBe('closed')
  })

  it('exact exception takes priority over annual', () => {
    const s = makeAllOpen('09:00', '21:00')
    const annual: IScheduleException = { year: null, month: 5, day: 4, isOpen: true, from: '10:00', to: '14:00' }
    const exact: IScheduleException = { year: 2026, month: 5, day: 4, isOpen: false, from: null, to: null }
    expect(getShopOpenStatus(s, [annual, exact], at(MON, 12))).toBe('closed')
  })

  it('exception for different day does not affect current day', () => {
    const s = makeAllOpen('09:00', '21:00')
    const exc: IScheduleException = { year: 2026, month: 5, day: 5, isOpen: false, from: null, to: null }
    expect(getShopOpenStatus(s, [exc], at(MON, 12))).toBe('open')
  })
})

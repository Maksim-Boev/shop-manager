import { describe, it, expect } from 'vitest'
import { parseOpeningHours, getShopOpenStatus } from '../../lib/utils/shop-status'

describe('parseOpeningHours', () => {
  it('parses standard hyphen', () => {
    expect(parseOpeningHours('08:00-22:00')).toEqual({
      startMinutes: 480, endMinutes: 1320,
    })
  })

  it('parses en-dash with spaces (seed format)', () => {
    expect(parseOpeningHours('08:00 – 22:00')).toEqual({
      startMinutes: 480, endMinutes: 1320,
    })
  })

  it('parses em-dash and varied whitespace', () => {
    expect(parseOpeningHours('  09:30  —  18:45  ')).toEqual({
      startMinutes: 570, endMinutes: 1125,
    })
  })

  it('accepts 24:00 as upper bound', () => {
    expect(parseOpeningHours('00:00-24:00')).toEqual({
      startMinutes: 0, endMinutes: 1440,
    })
  })

  it('returns null for null/undefined/empty', () => {
    expect(parseOpeningHours(null)).toBeNull()
    expect(parseOpeningHours(undefined)).toBeNull()
    expect(parseOpeningHours('')).toBeNull()
  })

  it('returns null for malformed input', () => {
    expect(parseOpeningHours('garbage')).toBeNull()
    expect(parseOpeningHours('8-22')).toBeNull()
    expect(parseOpeningHours('08:00 to 22:00')).toBeNull()
  })

  it('returns null when end <= start (через полночь не поддерживаем)', () => {
    expect(parseOpeningHours('22:00-06:00')).toBeNull()
    expect(parseOpeningHours('10:00-10:00')).toBeNull()
  })

  it('returns null for invalid time components', () => {
    expect(parseOpeningHours('25:00-26:00')).toBeNull()
    expect(parseOpeningHours('10:60-12:00')).toBeNull()
    expect(parseOpeningHours('24:30-22:00')).toBeNull()
  })
})

describe('getShopOpenStatus', () => {
  const at = (h: number, m = 0) => {
    const d = new Date()
    d.setHours(h, m, 0, 0)
    return d
  }

  it('returns "open" within working hours', () => {
    expect(getShopOpenStatus('08:00-22:00', at(10))).toBe('open')
    expect(getShopOpenStatus('08:00-22:00', at(8, 0))).toBe('open')
    expect(getShopOpenStatus('08:00-22:00', at(21, 59))).toBe('open')
  })

  it('returns "closed" outside working hours', () => {
    expect(getShopOpenStatus('08:00-22:00', at(7, 59))).toBe('closed')
    expect(getShopOpenStatus('08:00-22:00', at(22, 0))).toBe('closed')
    expect(getShopOpenStatus('08:00-22:00', at(3))).toBe('closed')
  })

  it('returns "unknown" for unparseable input', () => {
    expect(getShopOpenStatus(null)).toBe('unknown')
    expect(getShopOpenStatus('garbage')).toBe('unknown')
    expect(getShopOpenStatus('22:00-06:00')).toBe('unknown')
  })

  it('handles seed-format with en-dash', () => {
    expect(getShopOpenStatus('08:00 – 22:00', at(15))).toBe('open')
    expect(getShopOpenStatus('08:00 – 22:00', at(23))).toBe('closed')
  })
})

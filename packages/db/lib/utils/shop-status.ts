export type TShopOpenStatus = 'open' | 'closed' | 'unknown'

export interface IOpeningHours {
  startMinutes: number
  endMinutes: number
}

const HOURS_RE = /^(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})$/

export const parseOpeningHours = (raw: string | null | undefined): IOpeningHours | null => {
  if (!raw) return null
  const m = raw.trim().match(HOURS_RE)
  if (!m) return null

  const [, h1, m1, h2, m2] = m
  const startH = Number(h1), startM = Number(m1)
  const endH = Number(h2), endM = Number(m2)

  if (startH > 23 || startM > 59 || endH > 24 || endM > 59) return null
  if (endH === 24 && endM !== 0) return null

  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  if (endMinutes <= startMinutes) return null

  return { startMinutes, endMinutes }
}

export const getShopOpenStatus = (
  raw: string | null | undefined,
  now: Date = new Date(),
): TShopOpenStatus => {
  const parsed = parseOpeningHours(raw)
  if (!parsed) return 'unknown'
  const minutes = now.getHours() * 60 + now.getMinutes()
  return minutes >= parsed.startMinutes && minutes < parsed.endMinutes ? 'open' : 'closed'
}

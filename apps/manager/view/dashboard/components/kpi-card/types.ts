export interface IKpiCardProps {
  label: string
  value: string
  sub?: string
  delta?: number | null
  alert?: boolean
  icon: React.ElementType
  iconBg: string
}

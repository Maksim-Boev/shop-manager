export interface IAddStaffModalProps {
  open: boolean
  onClose: () => void
  stores: { id: string; name: string }[]
}

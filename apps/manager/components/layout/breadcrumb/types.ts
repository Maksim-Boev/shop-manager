interface IBreadcrumbItem {
  label: string
  href?: string
}

interface IBreadcrumbContextValue {
  items: IBreadcrumbItem[]
  setItems: (items: IBreadcrumbItem[]) => void
}

export type { IBreadcrumbItem, IBreadcrumbContextValue }

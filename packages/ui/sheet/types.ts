import * as React from "react"
import type { Dialog as SheetPrimitive } from "radix-ui"

export type SheetSide = "top" | "right" | "bottom" | "left"

export type SheetContentProps = React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: SheetSide
  showCloseButton?: boolean
}

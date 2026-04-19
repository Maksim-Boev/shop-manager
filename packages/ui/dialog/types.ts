import * as React from "react"
import type { Dialog as DialogPrimitive } from "radix-ui"

export type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}

export type DialogFooterProps = React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}

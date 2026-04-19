import * as React from "react"
import type { Select as SelectPrimitive } from "radix-ui"

export type SelectTriggerProps = React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}

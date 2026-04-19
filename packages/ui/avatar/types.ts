import * as React from "react"
import type { Avatar as AvatarPrimitive } from "radix-ui"

export type AvatarProps = React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "sm" | "lg"
}

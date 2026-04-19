import * as React from "react"
import { Slot } from "radix-ui"
import { cn } from "../cn"
import { badgeVariants, type BadgeProps } from "./types"

const Badge = ({
  className,
  variant = "default",
  asChild = false,
  ...props
}: BadgeProps) => {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge }

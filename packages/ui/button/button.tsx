import * as React from "react"
import { Slot } from "radix-ui"
import { cn } from "@/cn"
import { buttonVariants, type ButtonProps } from "./types"

const Button = ({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }

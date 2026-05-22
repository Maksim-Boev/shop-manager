import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import type { Tabs as TabsPrimitive } from "radix-ui"

export const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent w-full border-b border-border justify-start",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>

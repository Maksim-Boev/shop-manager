import * as React from "react"

export type CardProps = React.ComponentProps<"div"> & {
  size?: "default" | "sm"
}

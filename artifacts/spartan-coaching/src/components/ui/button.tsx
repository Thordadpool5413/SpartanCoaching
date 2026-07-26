import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 ease-out active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary/80 shadow-[0_10px_28px_-8px_hsl(var(--primary)/0.55)] hover:brightness-110 hover:shadow-[0_14px_36px_-8px_hsl(var(--primary)/0.65)]",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive/80 shadow-md hover:brightness-110",
        outline:
          "border border-border/90 bg-background/40 text-foreground shadow-sm hover:bg-muted/50 hover:border-primary/35 hover:text-foreground",
        secondary:
          "border border-border/70 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90",
        ghost:
          "border border-transparent text-foreground hover:bg-muted/60 hover:text-foreground",
      },
      size: {
        default: "min-h-11 px-5 py-2.5",
        sm: "min-h-9 rounded-lg px-4 text-xs",
        lg: "min-h-12 rounded-xl px-8 py-3 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }

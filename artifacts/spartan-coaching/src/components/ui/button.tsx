import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold tracking-wide cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-[transform,box-shadow,background-color,border-color,color,filter,opacity] duration-200 ease-out active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-white/15 shadow-elite-red hover:brightness-110 hover:shadow-[0_18px_44px_-10px_hsl(var(--primary)/0.75)]",
        destructive:
          "bg-destructive text-destructive-foreground border border-white/10 shadow-md hover:brightness-110",
        outline:
          "border-2 border-border bg-card/50 text-foreground shadow-sm backdrop-blur-sm hover:bg-muted/60 hover:border-primary/50 hover:text-foreground hover:shadow-elite",
        secondary:
          "border border-border/80 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 hover:border-primary/25",
        ghost:
          "border border-transparent text-foreground hover:bg-primary/10 hover:text-primary",
      },
      size: {
        default: "min-h-11 px-5 py-2.5",
        sm: "min-h-9 rounded-lg px-4 text-xs",
        lg: "min-h-12 rounded-xl px-8 py-3.5 text-base tracking-wide",
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

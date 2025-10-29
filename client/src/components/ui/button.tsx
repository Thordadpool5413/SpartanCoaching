
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-250" +
  " hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-primary-border shadow-lg hover:shadow-xl active:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-destructive-border shadow-lg hover:shadow-xl active:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border-2 [border-color:var(--button-outline)] shadow-md hover:shadow-lg active:shadow-sm hover:scale-[1.02] active:scale-[0.98]",
        secondary: "border-2 bg-secondary text-secondary-foreground border-secondary-border shadow-md hover:shadow-lg active:shadow-sm hover:scale-[1.02] active:scale-[0.98]",
        ghost: "border border-transparent hover:bg-accent/60 active:bg-accent/80",
      },
      size: {
        default: "min-h-10 px-5 py-2.5",
        sm: "min-h-9 rounded-md px-4 text-xs",
        lg: "min-h-12 rounded-xl px-10 text-base",
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

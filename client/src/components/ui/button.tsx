import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-gray-900 shadow-md active:shadow-sm rounded-2xl",
        destructive:
          "bg-red-500 text-white shadow-md active:shadow-sm rounded-2xl",
        outline:
          "border-2 border-gray-200 bg-white text-gray-900 active:bg-gray-50 rounded-2xl",
        secondary:
          "bg-gray-100 text-gray-900 active:bg-gray-200 rounded-2xl",
        ghost: "text-gray-700 active:bg-gray-100 rounded-2xl",
        link: "text-primary underline-offset-4 active:opacity-70",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 rounded-xl",
        lg: "h-14 px-8 py-4 text-base rounded-2xl",
        icon: "h-12 w-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

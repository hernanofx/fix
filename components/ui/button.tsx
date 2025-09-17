import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:grayscale will-change-transform hover:scale-[1.02] active:scale-[0.98]",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/25 hover:from-slate-800 hover:to-slate-700 hover:shadow-xl hover:shadow-slate-900/30 focus-visible:ring-slate-500",
                destructive:
                    "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/25 hover:from-red-500 hover:to-red-400 hover:shadow-xl hover:shadow-red-600/30 focus-visible:ring-red-500",
                outline:
                    "border-2 border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 shadow-sm hover:bg-slate-50/90 hover:border-slate-300 hover:shadow-md focus-visible:ring-slate-500",
                secondary:
                    "bg-gradient-to-r from-slate-100 to-slate-50 text-slate-900 shadow-md hover:from-slate-50 hover:to-white hover:shadow-lg focus-visible:ring-slate-400",
                ghost: "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 focus-visible:ring-slate-400",
                link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700 focus-visible:ring-blue-500",
                success:
                    "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-xl hover:shadow-emerald-600/30 focus-visible:ring-emerald-500",
                warning:
                    "bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-300 hover:shadow-xl hover:shadow-amber-500/30 focus-visible:ring-amber-400",
            },
            size: {
                default: "h-11 px-6 py-2.5",
                sm: "h-9 rounded-md px-4 text-xs",
                lg: "h-12 rounded-lg px-8 text-base",
                icon: "h-11 w-11",
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
        return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    },
)
Button.displayName = "Button"

export { Button, buttonVariants }

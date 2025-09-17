import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 backdrop-blur-sm will-change-transform hover:scale-105 active:scale-95",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg hover:from-slate-800 hover:to-slate-700 focus:ring-slate-500",
                secondary:
                    "border-transparent bg-gradient-to-r from-slate-100 to-slate-50 text-slate-900 shadow-md hover:from-slate-50 hover:to-white focus:ring-slate-300",
                destructive:
                    "border-transparent bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg hover:from-red-500 hover:to-red-400 focus:ring-red-400",
                success:
                    "border-transparent bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg hover:from-emerald-500 hover:to-emerald-400 focus:ring-emerald-400",
                warning:
                    "border-transparent bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-lg hover:from-amber-400 hover:to-amber-300 focus:ring-amber-300",
                info: "border-transparent bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg hover:from-blue-500 hover:to-blue-400 focus:ring-blue-400",
                outline:
                    "text-slate-700 border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm hover:bg-slate-50/90 hover:border-slate-300 focus:ring-slate-300",
                ghost: "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 focus:ring-slate-300",
            },
            size: {
                sm: "px-2 py-0.5 text-xs",
                default: "px-3 py-1 text-xs",
                lg: "px-4 py-1.5 text-sm font-medium",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, size, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { Badge, badgeVariants }

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
    "relative w-full rounded-xl border p-5 backdrop-blur-sm shadow-lg transition-all duration-200 ease-out [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-5 [&>svg]:top-5 [&>svg]:text-current [&>svg]:drop-shadow-sm",
    {
        variants: {
            variant: {
                default: "bg-slate-50/90 text-slate-900 border-slate-200/60 shadow-slate-200/50",
                destructive:
                    "border-red-200/60 text-red-900 bg-gradient-to-br from-red-50/90 to-red-100/80 shadow-red-200/50 [&>svg]:text-red-600",
                success:
                    "border-emerald-200/60 text-emerald-900 bg-gradient-to-br from-emerald-50/90 to-emerald-100/80 shadow-emerald-200/50 [&>svg]:text-emerald-600",
                warning:
                    "border-amber-200/60 text-amber-900 bg-gradient-to-br from-amber-50/90 to-amber-100/80 shadow-amber-200/50 [&>svg]:text-amber-600",
                info: "border-blue-200/60 text-blue-900 bg-gradient-to-br from-blue-50/90 to-blue-100/80 shadow-blue-200/50 [&>svg]:text-blue-600",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
)

const Alert = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h5 ref={ref} className={cn("mb-2 font-semibold leading-tight tracking-tight text-lg", className)} {...props} />
    ),
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("text-sm leading-relaxed [&_p]:leading-relaxed opacity-90", className)} {...props} />
    ),
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

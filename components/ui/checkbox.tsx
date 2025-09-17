import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
            "peer h-5 w-5 shrink-0 rounded-md border-2 border-slate-300 bg-white shadow-sm ring-offset-background transition-all duration-200 ease-out hover:border-slate-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-blue-600 data-[state=checked]:to-blue-500 data-[state=checked]:border-blue-600 data-[state=checked]:text-white data-[state=checked]:shadow-lg data-[state=checked]:shadow-blue-200/50 hover:data-[state=checked]:from-blue-500 hover:data-[state=checked]:to-blue-400",
            className,
        )}
        {...props}
    >
        <CheckboxPrimitive.Indicator
            className={cn("flex items-center justify-center text-current transition-all duration-200 ease-out")}
        >
            <Check className="h-3.5 w-3.5 drop-shadow-sm" />
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

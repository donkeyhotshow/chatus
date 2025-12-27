import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-14 w-full rounded-xl",
                    "border border-white/10 bg-[var(--bg-secondary)]",
                    "px-4 py-3 text-base text-white",
                    "placeholder:text-[var(--text-muted)]",
                    "shadow-sm shadow-black/20",
                    "hover:border-white/15",
                    "focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:shadow-md",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "transition-all duration-200 ease-out",
                    className
                )}
                ref={ref}
                style={{ fontSize: '16px' }}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }

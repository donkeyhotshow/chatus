import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-11 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]",
                    "px-4 py-2 text-base text-[var(--text-primary)]",
                    "placeholder:text-[var(--text-muted)]",
                    "focus:border-[var(--accent-primary)] focus:outline-none",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "transition-colors duration-150",
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

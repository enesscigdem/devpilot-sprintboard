import * as React from "react"

export type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "subtle"
export type ButtonSize = "default" | "sm" | "lg" | "icon"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[999px] text-sm font-medium touch-manipulation cursor-pointer transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-1)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-[var(--accent)] text-white shadow-sm hover:opacity-90 active:opacity-100",
  secondary: "bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border)] shadow-sm hover:bg-[var(--surface-3)] active:bg-[var(--surface-4)]",
  outline: "border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-secondary)] shadow-sm hover:bg-[var(--surface-2)] active:bg-[var(--surface-3)]",
  ghost: "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] active:bg-[var(--surface-3)]",
  destructive: "bg-[var(--destructive)] text-white shadow-sm hover:opacity-90 active:opacity-100 focus-visible:ring-[var(--destructive)]",
  subtle: "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] active:bg-[var(--surface-4)]",
}

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-4 sm:h-9 sm:py-2",
  sm: "h-11 px-3 text-xs sm:h-8",
  lg: "h-11 px-6 text-base sm:h-10",
  icon: "h-11 w-11 p-0 shrink-0 touch-manipulation sm:h-9 sm:w-9",
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "default", size = "default", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[baseClasses, variantClasses[variant], sizeClasses[size], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  )
})

export default Button

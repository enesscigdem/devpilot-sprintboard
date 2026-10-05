import * as React from "react"

export type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "subtle"
export type ButtonSize = "default" | "sm" | "lg" | "icon"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold touch-manipulation cursor-pointer transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.985]"

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-[var(--accent)] text-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.14),0_1px_3px_rgba(0,0,0,0.1)] hover:brightness-105 active:shadow-[0_1px_2px_rgba(0,0,0,0.1)] active:brightness-100",
  secondary: "bg-[var(--surface-2)] text-[var(--text-primary)] shadow-[0_0.5px_2px_rgba(0,0,0,0.08)] hover:bg-[var(--surface-3)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.1)] active:bg-[var(--surface-4)]",
  outline: "border border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] active:bg-[var(--surface-3)]",
  ghost: "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]/60 hover:text-[var(--text-primary)] active:bg-[var(--surface-2)]",
  destructive: "bg-[var(--destructive)] text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:brightness-105 hover:shadow-[0_2px_4px_rgba(0,0,0,0.14)] active:brightness-100 focus-visible:ring-[var(--destructive)]",
  subtle: "bg-[var(--surface-2)]/50 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] active:bg-[var(--surface-3)]/80",
}

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-5 sm:h-9 sm:px-4 sm:py-2",
  sm: "h-11 px-4 text-xs sm:h-8 sm:px-3",
  lg: "h-12 px-7 text-base sm:h-11 sm:px-6",
  icon: "h-11 w-11 p-0 shrink-0 touch-manipulation sm:h-9 sm:w-9 rounded-lg",
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

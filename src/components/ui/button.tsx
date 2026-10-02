import * as React from "react"

export type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "subtle"
export type ButtonSize = "default" | "sm" | "lg" | "icon"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium touch-manipulation cursor-pointer transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 active:bg-zinc-900",
  secondary: "bg-white text-zinc-900 border border-zinc-200 shadow-sm hover:bg-zinc-50 active:bg-zinc-100",
  outline: "border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 active:bg-zinc-100",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200/70",
  destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-700 focus-visible:ring-red-600",
  subtle: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 active:bg-zinc-300/80",
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

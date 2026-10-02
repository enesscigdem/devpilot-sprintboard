import * as React from "react"

export type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "subtle"
export type ButtonSize = "default" | "sm" | "lg" | "icon"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 active:bg-zinc-900",
  secondary: "bg-white text-zinc-900 border border-zinc-200 shadow-sm hover:bg-zinc-50",
  outline: "border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-700",
  subtle: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
}

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-10 px-6",
  icon: "h-8 w-8",
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

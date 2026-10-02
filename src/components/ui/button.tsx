import * as React from "react"

export type ButtonVariant = "default" | "outline" | "ghost" | "destructive"
export type ButtonSize = "default" | "sm" | "icon"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-blue-600 text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700",
  outline: "border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  destructive: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
}

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3",
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

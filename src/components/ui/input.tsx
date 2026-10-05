import * as React from "react"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={[
        "flex h-10 w-full border outline-none transition-[color,box-shadow,background-color,border-color] duration-150 ease-out disabled:cursor-not-allowed",
        "rounded-lg bg-[var(--surface-1)] border-[var(--border-subtle)]",
        "px-3 py-2 text-[15px] leading-[1.47] tracking-[-0.016em] text-[var(--text-primary)]",
        "shadow-[var(--shadow-sm)] placeholder:text-[var(--text-tertiary)]",
        "hover:border-[var(--border-default)] hover:bg-[var(--surface-1)]",
        "focus-visible:border-[#007AFF] focus-visible:bg-white focus-visible:shadow-[0_0_0_4px_rgba(0,122,255,0.12)] focus-visible:outline-none",
        "disabled:bg-[var(--surface-2)] disabled:text-[var(--text-disabled)] disabled:opacity-60",
        "aria-[invalid=true]:border-[var(--error)] aria-[invalid=true]:focus-visible:shadow-[var(--shadow-error)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  )
})

export default Input

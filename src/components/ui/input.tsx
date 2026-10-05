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
        "rounded-[var(--radius-lg)] bg-[var(--surface-2)] border-[var(--surface-3)]",
        "px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-body)] leading-6 tracking-[-0.01em] text-[var(--text-primary)]",
        "shadow-[var(--shadow-sm)] placeholder:text-[var(--text-tertiary)]",
        "hover:border-[var(--surface-4)] hover:bg-[var(--surface-1)]",
        "focus-visible:border-[var(--accent)] focus-visible:bg-[var(--surface-1)] focus-visible:shadow-[var(--shadow-focus)]",
        "disabled:bg-[var(--surface-3)] disabled:text-[var(--text-disabled)]",
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

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
        "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 aria-[invalid=true]:border-rose-400",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  )
})

export default Input

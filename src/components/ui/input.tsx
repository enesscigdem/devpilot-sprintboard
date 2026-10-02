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
        "flex h-10 w-full rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2 text-[0.9375rem] leading-6 tracking-[-0.01em] text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[color,box-shadow,background-color,border-color] duration-150 ease-out placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-slate-400 focus-visible:bg-white focus-visible:shadow-[0_0_0_3px_rgba(15,23,42,0.06)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 aria-[invalid=true]:border-rose-300 aria-[invalid=true]:focus-visible:border-rose-400 aria-[invalid=true]:focus-visible:shadow-[0_0_0_3px_rgba(244,63,94,0.12)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  )
})

export default Input

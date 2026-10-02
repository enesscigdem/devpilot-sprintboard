import * as React from "react"

type DialogContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogContext(component: string): DialogContextValue {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error(`${component} bileşeni<Dialog> içinde kullanılmalıdır.`)
  }
  return context
}

export type DialogProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function Dialog({ open, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = open !== undefined
  const isOpen = isControlled ? Boolean(open) : internalOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  const value = React.useMemo(() => ({ open: isOpen, setOpen }), [isOpen, setOpen])

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
}

export type DialogTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
}

export function DialogTrigger({ asChild = false, children, ...props }: DialogTriggerProps) {
  const { open, setOpen } = useDialogContext("DialogTrigger")

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>
    const childProps = child.props as { onClick?: (event: React.MouseEvent<HTMLElement>) => void }
    return React.cloneElement(child, {
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        childProps.onClick?.(event)
        setOpen(!open)
      },
    })
  }

  return (
    <button type="button" onClick={() => setOpen(!open)} {...props}>
      {children}
    </button>
  )
}

export function DialogOverlay({ className = "" }: { className?: string }) {
  return (
    <div
      data-slot="dialog-overlay"
      aria-hidden="true"
      className={[
        "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  )
}

export type DialogContentProps = React.HTMLAttributes<HTMLDivElement> & {
  hideClose?: boolean
}

export function DialogContent({ className = "", children, hideClose = false, ...props }: DialogContentProps) {
  const { open, setOpen } = useDialogContext("DialogContent")

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-4 sm:items-center">
      <DialogOverlay />
      <div
        role="dialog"
        aria-modal="true"
        className={[
          "relative z-50 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
        {hideClose ? null : (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Kapat"
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export function DialogHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["flex flex-col gap-1.5 text-left", className].filter(Boolean).join(" ")} {...props} />
}

export function DialogFooter({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={["mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

export function DialogTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={["text-base font-semibold tracking-tight text-slate-900", className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

export function DialogDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={["text-sm leading-6 text-slate-500", className].filter(Boolean).join(" ")} {...props} />
}

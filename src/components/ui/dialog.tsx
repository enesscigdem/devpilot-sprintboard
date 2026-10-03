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
        "fixed inset-0 z-50 bg-zinc-900/20",
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

  const contentRef = React.useRef<HTMLDivElement>(null)
  const setOpenRef = React.useRef(setOpen)
  setOpenRef.current = setOpen
  React.useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenRef.current(false)
      if (event.key === "Tab") {
        const focusable = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]') ?? [])
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener("keydown", onKeyDown)
    const frame = requestAnimationFrame(() => (contentRef.current?.querySelector<HTMLElement>("input") ?? contentRef.current)?.focus())
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
      cancelAnimationFrame(frame)
      previousFocus?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-4 sm:items-center" onClick={() => setOpen(false)}>
      <DialogOverlay />
      <div
        ref={contentRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className={[
          "relative z-50 w-full max-w-lg rounded-[20px] border border-zinc-200/60 bg-white p-6 text-zinc-800 shadow-[0_16px_40px_rgba(15,23,42,0.12),0_4px_16px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04] outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10",
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
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm ring-1 ring-zinc-200/70 transition hover:bg-zinc-50 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15"
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
      className={["mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end", className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

export function DialogTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={["text-[15px] font-semibold tracking-[-0.015em] text-zinc-900", className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

export function DialogDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={["text-[13px] leading-6 text-zinc-500", className].filter(Boolean).join(" ")} {...props} />
}


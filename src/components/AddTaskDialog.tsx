import { useState, type ChangeEvent, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export type NewTaskInput = {
  /** Görev başlığı */
  title: string
  /** İsteğe bağlı açıklama */
  description?: string
}

export type AddTaskDialogProps = {
  /** Yeni görev eklendiğinde çağrılır */
  onAdd: (input: NewTaskInput) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export default function AddTaskDialog({ onAdd, open: controlledOpen, onOpenChange, trigger }: AddTaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  function setOpen(next: boolean) {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
    if (!next) setError("")
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError("Başlık gerekli.")
      return
    }
    onAdd({ title: trimmed, description: description.trim() ? description.trim() : undefined })
    setTitle("")
    setDescription("")
    setError("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button" className="gap-1.5 shadow-sm">
            Yeni görev
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[480px] rounded-2xl border border-white/10 bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-in fade-in-0 zoom-in-98 duration-200">
        <DialogHeader>
          <DialogTitle className="text-[19px] font-semibold tracking-[-0.01em] text-foreground">Yeni görev ekle</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground/80">Yapılacak sütununa eklenecek görevi yazın.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 pt-2">
          <div className="grid gap-2">
            <label htmlFor="new-task-title" className="text-[13px] font-medium tracking-[-0.01em] text-foreground/90">
              Başlık
            </label>
            <Input
              id="new-task-title"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setTitle(e.target.value)
                if (error) setError("")
              }}
              placeholder="örn. Tasarımı gözden geçir"
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "new-task-title-error" : undefined}
            />
            {error ? (
              <p id="new-task-title-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <label htmlFor="new-task-description" className="text-[13px] font-medium tracking-[-0.01em] text-foreground/90">
              Açıklama <span className="font-normal text-muted-foreground">(isteğe bağlı)</span>
            </label>
            <textarea
              id="new-task-description"
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Kısa bir açıklama ekleyin"
              rows={3}
              className="flex min-h-[80px] w-full rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.05] px-3.5 py-3 text-[13px] leading-relaxed shadow-sm transition-all placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:border-blue-500/50 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
            />
          </div>
          <DialogFooter className="flex-col-reverse gap-2.5 pt-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-full h-9 px-5 text-[13px] font-medium hover:bg-black/[0.05] dark:hover:bg-white/[0.08]">
              Vazgeç
            </Button>
            <Button type="submit" className="rounded-full h-9 px-6 text-[13px] font-semibold bg-blue-500 hover:bg-blue-600 text-white shadow-sm">Ekle</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

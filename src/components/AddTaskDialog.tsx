import { useState, type FormEvent } from "react"
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
}

export default function AddTaskDialog({ onAdd, open: controlledOpen, onOpenChange }: AddTaskDialogProps) {
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
      <DialogTrigger asChild>
        <Button type="button">Yeni görev</Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni görev ekle</DialogTitle>
          <DialogDescription>Yapılacak sütununa eklenecek görevi yazın.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="new-task-title" className="text-sm font-medium">
              Başlık
            </label>
            <Input
              id="new-task-title"
              value={title}
              onChange={(e) => {
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
            <label htmlFor="new-task-description" className="text-sm font-medium">
              Açıklama <span className="font-normal text-muted-foreground">(isteğe bağlı)</span>
            </label>
            <textarea
              id="new-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kısa bir açıklama ekleyin"
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit">Ekle</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

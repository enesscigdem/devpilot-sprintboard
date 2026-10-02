import { useState, useEffect, type FormEvent } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Task, Board, TaskPriority, TaskStatus } from "@/types"

export type TaskUpdateInput = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  boardId: string
}

export type TaskDetailDialogProps = {
  task: Task | null
  boards: Board[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (taskId: string, updates: TaskUpdateInput) => void
  onDelete?: (taskId: string) => void
}

export default function TaskDetailDialog({
  task,
  boards,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TaskStatus>("todo")
  const [priority, setPriority] = useState<TaskPriority>("normal")
  const [dueDate, setDueDate] = useState("")
  const [boardId, setBoardId] = useState("")

  useEffect(() => {
    if (task) {
      setTitle(task.title || "")
      setDescription(task.description || "")
      setStatus(task.status || "todo")
      setPriority(task.priority || "normal")
      setDueDate(task.dueDate || "")
      setBoardId(task.boardId || (boards[0]?.id ?? ""))
    }
  }, [task, open, boards])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!task) return
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    onSave(task.id, {
      title: trimmedTitle,
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate ? dueDate : null,
      boardId: boardId || task.boardId,
    })
    onOpenChange(false)
  }

  function handleDelete() {
    if (!task || !onDelete) return
    onDelete(task.id)
    onOpenChange(false)
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Görevi Düzenle</DialogTitle>
            <DialogDescription>
              Görev detaylarını, durumunu, önceliğini ve panosunu buradan güncelleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="task-title" className="text-sm font-medium leading-none">
                Başlık
              </label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Görev başlığı..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="task-desc" className="text-sm font-medium leading-none">
                Açıklama
              </label>
              <textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="İsteğe bağlı görev açıklaması..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="task-status" className="text-sm font-medium leading-none">
                  Durum
                </label>
                <select
                  id="task-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="todo">Yapılacak</option>
                  <option value="in_progress">Devam Ediyor</option>
                  <option value="done">Tamamlandı</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="task-priority" className="text-sm font-medium leading-none">
                  Öncelik
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="low">Düşük</option>
                  <option value="normal">Normal</option>
                  <option value="high">Yüksek</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="task-due-date" className="text-sm font-medium leading-none">
                  Son Tarih
                </label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="task-board" className="text-sm font-medium leading-none">
                  Pano
                </label>
                <select
                  id="task-board"
                  value={boardId}
                  onChange={(e) => setBoardId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                Görevi Sil
              </Button>
            )}
            <div className="flex items-center space-x-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={!title.trim()}>
                Kaydet
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

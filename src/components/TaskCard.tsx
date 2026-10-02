import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Calendar, AlertCircle } from "lucide-react"

export type TaskStatus = "todo" | "inProgress" | "done"
export type TaskPriority = "low" | "normal" | "high"

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Yapılacak",
  inProgress: "Devam Ediyor",
  done: "Tamamlandı",
}

const STATUS_SHORT_LABELS: Record<TaskStatus, string> = {
  todo: "Yapılacak",
  inProgress: "Devam",
  done: "Tamam",
}

export type Task = {
  id: string
  boardId?: string
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string
  createdAt?: string
}

export type TaskCardProps = {
  task: Task
  onDelete?: (id: string) => void
  onStatusChange?: (id: string, status: TaskStatus) => void
  onMove?: (id: string, status: TaskStatus) => void
  onEdit?: (task: Task) => void
  isDragging?: boolean
}

export default function TaskCard({ task, onDelete, onStatusChange, onMove, isDragging }: TaskCardProps) {
  const handleStatusChange = (next: TaskStatus) => {
    onStatusChange?.(task.id, next)
    onMove?.(task.id, next)
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!(onStatusChange || onMove)) return
    if (e.target !== e.currentTarget) return
    const order: TaskStatus[] = ["todo", "inProgress", "done"]
    const current = task.status ?? "todo"
    if (e.key === "1" || e.key === "2" || e.key === "3") {
      e.preventDefault()
      handleStatusChange(order[Number(e.key) - 1])
      return
    }
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault()
      handleStatusChange(order[(order.indexOf(current) + 1) % order.length])
      return
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      handleStatusChange(order[(order.indexOf(current) + order.length - 1) % order.length])
    }
  }
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", task.id)
    e.dataTransfer.setData("application/x-task-id", task.id)
  }
  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      data-status={task.status ?? "todo"}
      aria-grabbed={isDragging ? true : undefined}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`group rounded-xl border border-border/60 bg-card/80 shadow-sm backdrop-blur transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 focus-visible:ring-offset-background cursor-grab active:cursor-grabbing ${isDragging ? "opacity-60 ring-2 ring-primary/30 scale-[0.98] shadow-md" : ""}`}
      aria-label={task.title}
      data-testid={`task-card-${task.id}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <CardTitle className="text-sm font-semibold leading-snug">
          {task.title}
        </CardTitle>
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${task.title} görevini sil`}
            className="h-8 w-8 shrink-0 text-muted-foreground opacity-70 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
      </CardHeader>
      {(onStatusChange || onMove) ? (
        <div className="px-4 pb-2">
          <div
            role="group"
            aria-label="Durum değiştir"
            className="inline-flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/40 p-0.5"
          >
            {(["todo", "inProgress", "done"] as TaskStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={(task.status ?? "todo") === status}
                aria-label={`Durumu ${STATUS_LABELS[status]} yap`}
                data-testid={`task-status-option-${task.id}-${status}`}
                onClick={() => handleStatusChange(status)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium leading-none transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  (task.status ?? "todo") === status
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                }`}
              >
                {STATUS_SHORT_LABELS[status]}
              </button>
            ))}
          </div>
          <label htmlFor={`task-status-${task.id}`} className="sr-only">
            Durum değiştir
          </label>
          <select
            id={`task-status-${task.id}`}
            value={task.status ?? "todo"}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            aria-label="Durum değiştir"
            data-testid={`task-status-select-${task.id}`}
            className="sr-only w-full rounded-md border border-border/60 bg-background px-2 py-1.5 text-xs font-medium text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="todo">Yapılacak</option>
            <option value="inProgress">Devam Ediyor</option>
            <option value="done">Tamamlandı</option>
          </select>
        </div>
      ) : null}
      {task.description ? (
        <CardContent className="p-4 pt-0">
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {task.description}
          </p>
        </CardContent>
      ) : null}
      {(task.dueDate || task.priority) ? (
        <CardContent className="p-4 pt-0 flex flex-wrap items-center gap-2 text-xs">
          {task.priority ? (
            <span
              className={`rounded-md px-2 py-0.5 font-medium ${
                task.priority === "high"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : task.priority === "low"
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/10 text-primary border border-primary/20"
              }`}
            >
              {task.priority === "high" ? "Yüksek" : task.priority === "low" ? "Düşük" : "Normal"}
            </span>
          ) : null}
          {task.dueDate ? (
            (() => {
              const isOverdue = task.status !== "done" && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
              return (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${
                    isOverdue
                      ? "bg-destructive/15 text-destructive border border-destructive/30"
                      : "bg-muted/70 text-muted-foreground border border-border/40"
                  }`}
                  data-testid={`task-due-date-${task.id}`}
                >
                  {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                  {task.dueDate}
                </span>
              )
            })()
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  )
}

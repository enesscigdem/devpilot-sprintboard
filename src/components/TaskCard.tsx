import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export type TaskStatus = "todo" | "inProgress" | "done"

export type Task = {
  id: string
  title: string
  description?: string
  status?: TaskStatus
}

export type TaskCardProps = {
  task: Task
  onDelete?: (id: string) => void
  onStatusChange?: (id: string, status: TaskStatus) => void
  onMove?: (id: string, status: TaskStatus) => void
  isDragging?: boolean
}

export default function TaskCard({ task, onDelete, onStatusChange, onMove, isDragging }: TaskCardProps) {
  const handleStatusChange = (next: TaskStatus) => {
    onStatusChange?.(task.id, next)
    onMove?.(task.id, next)
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
      className={`group border-border/60 bg-card/80 shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:bg-card cursor-grab active:cursor-grabbing ${isDragging ? "opacity-60 ring-2 ring-primary/30 scale-[0.98] shadow-md" : ""}`}
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
          <label htmlFor={`task-status-${task.id}`} className="sr-only">
            Durum değiştir
          </label>
          <select
            id={`task-status-${task.id}`}
            value={task.status ?? "todo"}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            aria-label="Durum değiştir"
            data-testid={`task-status-select-${task.id}`}
            className="w-full rounded-md border border-border/60 bg-background px-2 py-1.5 text-xs font-medium text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
    </Card>
  )
}

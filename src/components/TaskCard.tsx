import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export type Task = {
  id: string
  title: string
  description?: string
}

export type TaskCardProps = {
  task: Task
  onDelete?: (id: string) => void
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  return (
    <Card
      className="group border-border/60 bg-card/80 shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:bg-card"
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

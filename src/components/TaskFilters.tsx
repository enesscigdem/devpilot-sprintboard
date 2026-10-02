import type { ChangeEvent } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { TaskPriority, TaskStatus } from "@/types"

export type TaskFiltersProps = {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: TaskStatus | "all"
  onStatusFilterChange: (status: TaskStatus | "all") => void
  priorityFilter: TaskPriority | "all"
  onPriorityFilterChange: (priority: TaskPriority | "all") => void
  onReset?: () => void
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onReset,
}: TaskFiltersProps) {
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "all" ||
    priorityFilter !== "all"

  function handleResetAll() {
    onSearchChange("")
    onStatusFilterChange("all")
    onPriorityFilterChange("all")
    onReset?.()
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Başlık veya açıklamada ara..."
          value={searchQuery}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          className="pl-9 pr-8"
          aria-label="Görev ara"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Aramayı temizle"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as TaskStatus | "all")}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Durum filtresi"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="backlog">Yapılacaklar</option>
          <option value="in-progress">Devam Edenler</option>
          <option value="done">Tamamlananlar</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => onPriorityFilterChange(e.target.value as TaskPriority | "all")}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Öncelik filtresi"
        >
          <option value="all">Tüm Öncelikler</option>
          <option value="low">Düşük</option>
          <option value="normal">Normal</option>
          <option value="high">Yüksek</option>
        </select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetAll}
            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Filtreleri Sıfırla
          </Button>
        )}
      </div>
    </div>
  )
}

export default TaskFilters

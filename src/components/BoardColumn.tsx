import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ColumnTask = BoardTask & { status?: string };

export type BoardTask = {
  /** Görev kimliği */
  id: string
  /** Görev başlığı */
  title: string
  /** İsteğe bağlı açıklama */
  description?: string
}

export type BoardColumnProps = {
  /** Sütun başlığı (örn. "Yapılacak") */
  title: string
  /** Sütun içindeki kartlar */
  items?: Array<BoardTask | string>
  /** Görev silme geri çağrısı */
  onDeleteTask?: (id: string) => void
  onDropTask?: (id: string) => void
  /** Sütuna görev ekleme aksiyonu */
  onAddTask?: () => void
  /** Kart üzerinden durum değiştirme (mobil ve klavye kullanımı) */
  onStatusChange?: (id: string, status: string) => void
  /** Durum seçeneğinde sunulacak sütun adları */
  statusOptions?: readonly string[]
}

export default function BoardColumn({ title, items = [], onDeleteTask, onDropTask, onAddTask, onStatusChange, statusOptions = [] }: BoardColumnProps) {
  const [isOver, setIsOver] = useState(false)
  const tasks: ColumnTask[] = items.map(
    (item) => (typeof item === "string" ? { id: item, title: item } : item),
  )

  const tone = /tamam/i.test(title)
    ? { dot: "bg-emerald-500", accent: "border-l-emerald-400", chip: "border-emerald-200 bg-emerald-50 text-emerald-700" }
    : /devam|doing|progress/i.test(title)
      ? { dot: "bg-blue-500", accent: "border-l-blue-400", chip: "border-blue-200 bg-blue-50 text-blue-700" }
      : { dot: "bg-slate-400", accent: "border-l-slate-300", chip: "border-slate-200 bg-slate-100 text-slate-600" }

  return (
    <Card onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setIsOver(true); }} onDragLeave={() => setIsOver(false)} onDrop={(e) => { e.preventDefault(); setIsOver(false); const id = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("application/x-task-id"); if (id) onDropTask?.(id); }} className={`flex min-h-[280px] flex-col rounded-2xl border border-slate-200/70 bg-slate-100/40 transition-[background-color,border-color,box-shadow] duration-150 ${isOver ? "border-blue-300 bg-blue-50/60 ring-2 ring-blue-500/15" : ""}`} aria-label={title} data-drag-over={isOver ? "true" : undefined}>
      <CardHeader className="flex-row items-center gap-2 space-y-0 px-3 py-2.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
        <CardTitle className="text-[13px] font-semibold tracking-tight text-slate-800 antialiased">{title}</CardTitle>
        <span className={`${onAddTask ? "" : "ml-auto "}inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-slate-200/70 px-1.5 text-[11px] font-medium tabular-nums text-slate-600`}>{tasks.length}</span>
        {onAddTask ? (
          <button
            type="button"
            onClick={onAddTask}
            aria-label={`${title} sütununa görev ekle`}
            className="ml-auto inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        ) : null}
      </CardHeader>

      <CardContent className="px-3 pb-3 pt-0">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-start gap-1 rounded-xl border border-slate-200/60 bg-white/60 px-3 py-5">
            <p className="text-[13px] leading-5 text-slate-400">Henüz görev yok.</p>
            {onAddTask ? (
              <button
                type="button"
                onClick={onAddTask}
                className="text-[13px] font-medium text-blue-600 underline-offset-2 transition hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
              >
                Görev ekle
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {tasks.map((task) => (
              <li
                key={task.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", task.id);
                  event.dataTransfer.setData("application/x-task-id", task.id);
                }}
                className={`group flex cursor-grab items-start gap-2 rounded-xl border border-slate-200/70 border-l-[3px] ${tone.accent} bg-white p-3 text-sm leading-5 text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-[box-shadow,border-color] duration-150 hover:shadow-[0_4px_12px_rgba(15,23,42,0.09)] focus-within:border-blue-300 active:cursor-grabbing`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-5 text-slate-900">{task.title}</p>
                  {task.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{task.description}</p> : null}
                  {onStatusChange && statusOptions.length > 0 ? (
                    <label className="sr-only" htmlFor={`gorev-durum-${task.id}`}>
                      Durum değiştir
                    </label>
                  ) : null}
                  {onStatusChange && statusOptions.length > 0 ? (
                    <select
                      id={`gorev-durum-${task.id}`}
                      value={task.status ?? "Yapılacak"}
                      onChange={(event) => onStatusChange(task.id, event.target.value)}
                      className={`mt-2 w-auto max-w-full cursor-pointer appearance-none rounded-full border px-2 py-0.5 text-[11px] font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500/25 ${tone.chip}`}
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
               <button
                  type="button"
                  onClick={() => onDeleteTask?.(task.id)}
                  aria-label={`${task.title} görevini sil`}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-300 opacity-100 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </li>
              ))}
            </ul>
          )}
      </CardContent>
    </Card>
  )
}

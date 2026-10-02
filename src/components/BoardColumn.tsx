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
  /** Kart üzerinden durum değiştirme (mobil ve klavye kullanımı) */
  onStatusChange?: (id: string, status: string) => void
  /** Durum seçeneğinde sunulacak sütun adları */
  statusOptions?: readonly string[]
}

export default function BoardColumn({ title, items = [], onDeleteTask, onDropTask, onStatusChange, statusOptions = [] }: BoardColumnProps) {
  const [isOver, setIsOver] = useState(false)
  const tasks: ColumnTask[] = items.map(
    (item) => (typeof item === "string" ? { id: item, title: item } : item),
  )

  return (
    <Card onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setIsOver(true); }} onDragLeave={() => setIsOver(false)} onDrop={(e) => { e.preventDefault(); setIsOver(false); const id = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("application/x-task-id"); if (id) onDropTask?.(id); }} className={`flex min-h-[280px] flex-col overflow-hidden rounded-2xl transition-all duration-200 ${isOver ? "border-blue-400/60 bg-blue-50/40 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20" : ""}`} aria-label={title} data-drag-over={isOver ? "true" : undefined}>
      <CardHeader className="flex-row items-center gap-3 space-y-0 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
        <span className="h-2.5 w-2.5 rounded-full bg-blue-500/90 shadow-sm shadow-blue-500/20 ring-4 ring-blue-50" aria-hidden="true" />
        <CardTitle className="text-[13px] font-semibold tracking-tight text-slate-900 antialiased">{title}</CardTitle>
        <span className="ml-auto inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border border-slate-200 bg-white px-2 text-xs font-medium tabular-nums text-slate-600 shadow-sm">{tasks.length}</span>
      </CardHeader>

      <CardContent className="p-4">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></svg></span><p className="text-sm font-medium text-slate-500">Bu sütunda henüz kart yok.</p></div>
        ) : (
          <ul className="flex flex-col gap-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", task.id);
                  event.dataTransfer.setData("application/x-task-id", task.id);
                }}
                className="group flex cursor-grab items-start gap-2.5 rounded-xl border border-slate-200/60 bg-white p-3 text-sm leading-6 text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150 hover:-translate-y-px hover:border-slate-300/80 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)] active:cursor-grabbing"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800">{task.title}</p>
                  {task.description ? <p className="mt-1 text-xs text-slate-500">{task.description}</p> : null}
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
                      className="mt-2 w-auto max-w-full cursor-pointer appearance-none rounded-full border border-slate-200/80 bg-slate-50 py-1 pl-2.5 pr-7 text-[11px] font-medium text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
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
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 opacity-0 transition hover:border-rose-200 hover:text-rose-600 focus-visible:opacity-100 group-hover:opacity-100"
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

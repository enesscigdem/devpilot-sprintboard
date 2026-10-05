import { useState } from "react";
import { Plus, Circle, CircleDashed, CircleCheck, ChevronDown, Trash2, GripVertical, ArrowUpRight } from "lucide-react";

export type BoardTask = { id: string; title: string; description?: string };
type ColumnTask = BoardTask & { status?: string };
export type BoardColumnProps = {
  title: string;
  items?: Array<BoardTask | string>;
  onDeleteTask?: (id: string) => void;
  onDropTask?: (id: string) => void;
  onAddTask?: () => void;
  onStatusChange?: (id: string, status: string) => void;
  statusOptions?: readonly string[];
  filtered?: boolean;
};

export default function BoardColumn({ title, items = [], onDeleteTask, onDropTask, onAddTask, onStatusChange, statusOptions = [], filtered = false }: BoardColumnProps) {
  const [isOver, setIsOver] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const tasks: ColumnTask[] = items.map(item => typeof item === "string" ? { id: item, title: item } : item);
  const kind = title === "Tamamlandı" ? "done" : title === "Devam Ediyor" ? "doing" : "todo";
  const StatusIcon = kind === "done" ? CircleCheck : kind === "doing" ? CircleDashed : Circle;
  const subtitles = { todo: "Sıradaki güzel fikir", doing: "Şimdi odaklandıkların", done: "Emeğinin karşılığı" };
  return (
    <section className={`notes-column notes-column-${kind} ${isOver ? "notes-drag-over" : ""}`} aria-label={title} data-drag-over={isOver || undefined}
      onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setIsOver(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsOver(false); }}
      onDrop={event => { event.preventDefault(); setIsOver(false); const id = event.dataTransfer.getData("text/plain") || event.dataTransfer.getData("application/x-task-id"); if (id) onDropTask?.(id); }}>
      <header className="notes-header"><div className="notes-header-content"><span className="notes-status-icon"><StatusIcon size={16} strokeWidth={2} /></span><h2 className="notes-title">{title}</h2><span className="notes-count">{tasks.length}</span></div>{onAddTask && <button className="notes-add-btn" aria-label={`${title} sütununa görev ekle`} onClick={onAddTask}><Plus size={16} strokeWidth={2} /></button>}</header>
      <p className="notes-subtitle">{subtitles[kind]}</p>
      <ul className="notes-list">
        {tasks.map(task => <li key={task.id} className={`notes-card ${dragging === task.id ? "notes-dragging" : ""}`} draggable
          onDragStart={event => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", task.id); event.dataTransfer.setData("application/x-task-id", task.id); setDragging(task.id); }}
          onDragEnd={() => setDragging(null)}>
          <div className="notes-card-header"><span className="notes-tag"><span className="notes-tag-dot" />{kind === "done" ? "Tamamlandı" : "Görev"}</span><div className="notes-card-actions"><GripVertical size={14} className="notes-grip" aria-hidden="true" />{onDeleteTask && <button className="notes-delete-btn" aria-label={`${task.title} görevini sil`} onClick={() => onDeleteTask(task.id)}><Trash2 size={13} strokeWidth={2} /></button>}</div></div>
          <h3 className="notes-card-title">{task.title}</h3>{task.description && <p className="notes-card-description">{task.description}</p>}
          <div className="notes-card-footer">{onStatusChange && statusOptions.length > 0 && <label className="notes-status-picker"><StatusIcon size={12} strokeWidth={2} /><span className="sr-only">Durum değiştir</span><select aria-label="Durum değiştir" value={task.status ?? title} onChange={event => onStatusChange(task.id, event.target.value)}>{statusOptions.map(status => <option key={status}>{status}</option>)}</select><ChevronDown size={11} /></label>}<ArrowUpRight size={13} className="notes-card-arrow" aria-hidden="true" /></div>
        </li>)}
      </ul>
      {tasks.length === 0 && <div className="notes-empty"><span className="notes-empty-icon"><StatusIcon size={28} strokeWidth={1.5} /></span><p className="notes-empty-title">{filtered ? "Eşleşen görev yok" : "Henüz görev yok"}</p><span className="notes-empty-subtitle">{filtered ? "Aramayı veya filtreyi değiştirebilirsin." : kind === "todo" ? "Her şey küçük bir adımla başlar." : kind === "doing" ? "Hazır olduğunda bir görevi buraya taşı." : "Tamamladığın işler burada birikir."}</span></div>}
      {onAddTask && <button className="notes-new-task" onClick={onAddTask}><Plus size={15} strokeWidth={2} />Görev ekle</button>}
    </section>
  );
}

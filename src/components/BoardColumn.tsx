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
    <section className={`kanban-column ${kind} ${isOver ? "drag-over" : ""}`} aria-label={title} data-drag-over={isOver || undefined}
      onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setIsOver(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsOver(false); }}
      onDrop={event => { event.preventDefault(); setIsOver(false); const id = event.dataTransfer.getData("text/plain") || event.dataTransfer.getData("application/x-task-id"); if (id) onDropTask?.(id); }}>
      <header className="column-heading"><span className="column-status-icon"><StatusIcon size={17} /></span><h2>{title}</h2><span className="column-count">{tasks.length}</span>{onAddTask && <button className="icon-button column-add" aria-label={`${title} sütununa görev ekle`} onClick={onAddTask}><Plus size={17} /></button>}</header>
      <p className="column-subtitle">{subtitles[kind]}</p>
      <ul className="task-list">
        {tasks.map(task => <li key={task.id} className={`task-tile ${dragging === task.id ? "is-dragging" : ""}`} draggable
          onDragStart={event => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", task.id); event.dataTransfer.setData("application/x-task-id", task.id); setDragging(task.id); }}
          onDragEnd={() => setDragging(null)}>
          <div className="task-tile-top"><span className="task-category"><span />{kind === "done" ? "TAMAMLANDI" : "GÖREV"}</span><div className="task-actions"><GripVertical size={14} className="drag-grip" aria-hidden="true" />{onDeleteTask && <button className="icon-button delete-task" aria-label={`${task.title} görevini sil`} onClick={() => onDeleteTask(task.id)}><Trash2 size={14} /></button>}</div></div>
          <h3>{task.title}</h3>{task.description && <p className="task-description">{task.description}</p>}
          <div className="task-tile-footer">{onStatusChange && statusOptions.length > 0 && <label className="task-status-select"><StatusIcon size={12} /><span className="sr-only">Durum değiştir</span><select aria-label="Durum değiştir" value={task.status ?? title} onChange={event => onStatusChange(task.id, event.target.value)}>{statusOptions.map(status => <option key={status}>{status}</option>)}</select><ChevronDown size={12} /></label>}<ArrowUpRight size={14} className="task-arrow" aria-hidden="true" /></div>
        </li>)}
      </ul>
      {tasks.length === 0 && <div className="column-empty"><span className="empty-icon"><StatusIcon size={23} strokeWidth={1.3} /></span><p>{filtered ? "Eşleşen görev yok." : "Henüz görev yok."}</p><span>{filtered ? "Aramayı veya filtreyi değiştirebilirsin." : kind === "todo" ? "Her şey küçük bir adımla başlar." : kind === "doing" ? "Hazır olduğunda bir görevi buraya taşı." : "Tamamladığın işler burada birikir."}</span></div>}
      {onAddTask && <button className="column-new-task" onClick={onAddTask}><Plus size={14} />Görev ekle</button>}
    </section>
  );
}

import "./index.css";
import { useEffect, useRef, useState } from "react";
import BoardColumn, { type BoardTask } from "./components/BoardColumn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { LayoutGrid, List, Search, Plus, PanelLeft, Check, ArrowUpRight, Columns3, CircleCheck, X, Laptop, ChevronDown } from "lucide-react";

const COLUMN_STATUSES = ["Yapılacak", "Devam Ediyor", "Tamamlandı"] as const;

type ColumnStatus = (typeof COLUMN_STATUSES)[number];

type StoredTask = BoardTask & { status: ColumnStatus };

const STORAGE_KEY = "sprintboard.tasks.v1";

const isColumnStatus = (value: unknown): value is ColumnStatus =>
  typeof value === "string" &&
  (COLUMN_STATUSES as readonly string[]).includes(value);

/** Bozuk veya eski kayıtları yok sayarak görev listesini geri yükler. */
const loadTasks = (): StoredTask[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const list: unknown[] = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { tasks?: unknown }).tasks)
        ? ((parsed as { tasks: unknown[] }).tasks)
        : [];
    const seen = new Set<string>();
    const result: StoredTask[] = [];
    for (const entry of list) {
      if (!entry || typeof entry !== "object") continue;
      const record = entry as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const title = typeof record.title === "string" ? record.title.trim() : "";
      if (!id || !title || seen.has(id)) continue;
      seen.add(id);
      const description =
        typeof record.description === "string" ? record.description.trim() : "";
      result.push({
        id,
        title,
        ...(description ? { description } : {}),
        status: isColumnStatus(record.status) ? record.status : "Yapılacak",
      });
    }
    return result;
  } catch {
    return [];
  }
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `gorev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function App() {
  const [tasks, setTasks] = useState<StoredTask[]>(loadTasks);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ColumnStatus | "Tümü">("Tümü");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<"board" | "list">("board");
  const [newStatus, setNewStatus] = useState<ColumnStatus>("Yapılacak");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); searchRef.current?.focus();
      }
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openComposer = (status: ColumnStatus = "Yapılacak") => {
    setNewStatus(status); setOpen(true); setSidebarOpen(false);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Kota dolu veya depolama erişimi kapalıysa panoyu sessizce kullanmaya devam et.
    }
  }, [tasks]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Başlık zorunludur.");
      return;
    }
    const cleanDescription = description.trim();
    setTasks((prev) => [
      ...prev,
      {
        id: newId(),
        title: cleanTitle,
        ...(cleanDescription ? { description: cleanDescription } : {}),
        status: newStatus,
      },
    ]);
    resetForm();
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const matchesQuery = (task: StoredTask) => {
    const needle = query.trim().toLocaleLowerCase("tr");
    if (!needle) return true;
    return (
      task.title.toLocaleLowerCase("tr").includes(needle) ||
      (task.description ?? "").toLocaleLowerCase("tr").includes(needle)
    );
  };

  const tasksIn = (status: ColumnStatus) =>
    tasks.filter((task) => task.status === status && matchesQuery(task) && (filter === "Tümü" || task.status === filter));

  const countIn = (status: ColumnStatus) =>
    tasks.filter((task) => task.status === status).length;

  const doneCount = countIn("Tamamlandı");
  const progress = tasks.length ? Math.round(doneCount / tasks.length * 100) : 0;
  const visibleCount = COLUMN_STATUSES.reduce((sum, status) => sum + tasksIn(status).length, 0);

  const handleMoveTask = (status: ColumnStatus) => (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id && task.status !== status ? { ...task, status } : task,
      ),
    );
  };

  const handleStatusChange = (id: string, status: string) => {
    if (!isColumnStatus(status)) return;
    handleMoveTask(status)(id);
  };

  return (
    <div className="notes-workspace">
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Panolar menüsünü kapat" onClick={() => setSidebarOpen(false)} />}
      <aside id="workspace-sidebar" className={`notes-sidebar ${sidebarOpen ? "is-open" : ""}`} aria-label="Panolar">
        <a className="notes-brand" href="#main"><span className="notes-brand-mark"><Columns3 size={20} strokeWidth={2.2} /></span><span>SprintBoard<span className="notes-brand-caption">Kişisel çalışma alanı</span></span></a>
        <div className="notes-sidebar-label">ÇALIŞMA ALANI</div>
        <button className="notes-sidebar-item" aria-current="true" onClick={() => {setFilter("Tümü"); setQuery(""); setSidebarOpen(false);}}>
          <span className="notes-item-icon"><LayoutGrid size={16} /></span><span>Sprint 1</span><span className="notes-sidebar-count">{tasks.length}</span>
        </button>
        <div className="notes-sidebar-note"><span className="notes-note-line" /><p>Büyük fikirler.<br /><strong>Küçük adımlar.</strong></p></div>
        <div className="notes-sidebar-bottom">
          <div className="notes-sidebar-progress"><span>Pano ilerlemesi</span><strong>%{progress}</strong></div>
          <div className="notes-progress-track" role="progressbar" aria-label="Pano ilerlemesi" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{width: `${progress}%`}} /></div>
          <div className="notes-local-note"><Laptop size={15} /><span>Bu tarayıcıda saklanır</span><span className="notes-local-dot" /></div>
        </div>
      </aside>
      <div className="notes-main">
        <header className="notes-topbar">
          <div className="notes-breadcrumb"><button className="notes-icon-button notes-sidebar-toggle" aria-label="Panolar menüsü" aria-controls="workspace-sidebar" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)}><PanelLeft size={18} /></button><span>Çalışma alanı</span><span className="notes-breadcrumb-separator">/</span><strong>Sprint 1</strong></div>
          <div className="notes-topbar-detail"><span className="notes-local-dot" /> Kişisel pano</div>
        </header>
        <main id="main" className="notes-content">
          <section className="board-heading" aria-labelledby="board-title">
            <div><div className="eyebrow"><span /> KENDİ TEMPOYLA, İLERİYE.</div><h1 id="board-title">Sprint 1<span className="heading-dot">.</span></h1><p className="board-description">Fikirlerini sıraya koy. Bir sonraki adıma odaklan.</p></div>
            <button className="primary-button" onClick={() => openComposer()}><Plus size={17} />Yeni görev</button>
          </section>
          <section className="board-overview" aria-label="Pano özeti">
            <div className="overview-caption"><span className="overview-icon"><Columns3 size={19} /></span><div><strong>{tasks.length ? `${tasks.length} görev, tek bir odak.` : "Yeni bir başlangıç."}</strong><span>{tasks.length ? `${doneCount} tamamlandı · ${tasks.length - doneCount} görev seni bekliyor` : "Henüz görev yok"}</span></div></div>
            <div className="overview-completion"><span className="completion-ring" style={{background: `conic-gradient(var(--accent-color) ${progress}%, var(--line) 0)`}}><span><Check size={14} /></span></span><div><strong>%{progress}</strong><span>tamamlandı</span></div></div>
          </section>
          <div className="board-toolbar">
            <div className="view-control" role="group" aria-label="Görünüm"><button aria-pressed={view === "board"} onClick={() => setView("board")}><LayoutGrid size={15} />Pano</button><button aria-pressed={view === "list"} onClick={() => setView("list")}><List size={16} />Liste</button></div>
            <div className="toolbar-actions"><div className="search-field"><Search size={16} /><input ref={searchRef} type="search" aria-label="Görevlerde ara" placeholder="Görevlerde ara…" value={query} onChange={e => setQuery(e.target.value)} /><kbd>⌘ K</kbd></div>
              <label className="filter-control"><span className="sr-only">Duruma göre filtrele</span><select aria-label="Duruma göre filtrele" value={filter} onChange={e => setFilter(e.target.value as typeof filter)}>{["Tümü", ...COLUMN_STATUSES].map(status => <option key={status} value={status}>{status === "Tümü" ? "Tüm durumlar" : status}</option>)}</select><ChevronDown size={14} /></label>
            </div>
          </div>
          {(query || filter !== "Tümü") && <div className="filter-summary"><span>{visibleCount} görev gösteriliyor</span><button onClick={() => {setQuery(""); setFilter("Tümü");}}><X size={12} />Filtreleri temizle</button></div>}
          <div className={`board-columns ${view === "list" ? "list-view" : ""}`}>
            {COLUMN_STATUSES.map(status => <BoardColumn key={status} title={status} items={tasksIn(status)} onAddTask={() => openComposer(status)} onDeleteTask={handleDelete} onDropTask={handleMoveTask(status)} statusOptions={COLUMN_STATUSES} onStatusChange={handleStatusChange} filtered={Boolean(query.trim()) || filter !== "Tümü"} />)}
          </div>
          <footer className="board-footer"><span><CircleCheck size={14} />Bir görev daha, bir adım ileri.</span><span>Kartları sürükleyerek taşı <ArrowUpRight size={13} /></span></footer>
        </main>
      </div>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="task-composer" aria-labelledby="composer-title" aria-describedby="composer-description">
          <DialogHeader><span className="composer-icon"><Plus size={22} /></span><DialogTitle id="composer-title">Yeni bir adım.</DialogTitle><DialogDescription id="composer-description">Aklındakini bir göreve dönüştür.</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit} noValidate>
            <label className="field-label" htmlFor="gorev-baslik">Başlık</label>
            <input id="gorev-baslik" className="form-input" placeholder="Ne üzerinde çalışacaksın?" value={title} onChange={e => {setTitle(e.target.value); setError(null);}} aria-invalid={Boolean(error)} aria-describedby={error ? "title-error" : undefined} />
            {error && <p id="title-error" className="form-error" role="alert">{error}</p>}
            <label className="field-label" htmlFor="gorev-aciklama">Açıklama <span>(isteğe bağlı)</span></label>
            <textarea id="gorev-aciklama" className="form-input" rows={4} placeholder="Biraz detay, daha net bir başlangıç…" value={description} onChange={e => setDescription(e.target.value)} />
            <label className="field-label" htmlFor="new-status">Durum</label><select id="new-status" className="form-input" value={newStatus} onChange={e => setNewStatus(e.target.value as ColumnStatus)}>{COLUMN_STATUSES.map(status => <option key={status}>{status}</option>)}</select>
            <DialogFooter><button type="button" className="secondary-button" onClick={() => handleOpenChange(false)}>Vazgeç</button><button type="submit" className="primary-button"><Plus size={16} />Görevi ekle</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

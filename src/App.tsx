import "./index.css";
import { useEffect, useState } from "react";
import BoardColumn, { type BoardTask } from "./components/BoardColumn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
        status: "Yapılacak",
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
    tasks.filter((task) => task.status === status && matchesQuery(task));

  const countIn = (status: ColumnStatus) =>
    tasks.filter((task) => task.status === status).length;

  const doneCount = countIn("Tamamlandı");
  const summaryLabel =
    tasks.length === 0
      ? "Henüz görev yok"
      : `${tasks.length} görev · ${doneCount} tamamlandı`;

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
    <div className="sb-app font-sans antialiased selection:bg-blue-100">
      <aside
        className={`sb-sidebar flex flex-col gap-1 px-3 py-5 max-[900px]:fixed max-[900px]:inset-x-3 max-[900px]:top-16 max-[900px]:z-50 max-[900px]:rounded-2xl max-[900px]:border max-[900px]:border-slate-200 max-[900px]:shadow-lg ${sidebarOpen ? "max-[900px]:block" : "max-[900px]:hidden"}`}
        aria-label="Panolar"
      >
        <div className="flex items-center gap-2.5 px-3 pb-5 pt-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M8 9h8M8 12h8M8 15h5" /></svg>
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">SprintBoard</span>
        </div>
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          Panolar
        </p>
        <button
          type="button"
          data-active="true"
          aria-current="true"
          onClick={() => setSidebarOpen(false)}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
          <span className="truncate">Sprint 1</span>
          <span className="ml-auto text-[11px] font-medium tabular-nums text-blue-600/70">
            {tasks.length}
          </span>
        </button>
        <p className="mt-5 px-3 text-[11px] leading-4 text-slate-400">
          Planlanan görevleri tek bir çalışma alanından yönetin.
        </p>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/90 supports-[backdrop-filter]:bg-white/75">
        <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8 md:py-5">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-expanded={sidebarOpen}
            aria-label="Panolar menüsü"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 max-[900px]:inline-flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h1 className="truncate text-[17px] font-semibold tracking-tight text-slate-900">Sprint 1</h1>
            <p className="truncate text-xs leading-none text-slate-500">{summaryLabel}</p>
          </div>
                   <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenChange(true)}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              Yeni görev
            </button>
          </div>
        </div>
      </header>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight text-slate-900">Yeni görev</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Panoya eklenecek görevin başlığını ve isteğe bağlı açıklamasını girin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gorev-baslik" className="text-xs font-medium text-slate-700">
                Başlık
              </label>
              <input
                id="gorev-baslik"
                name="title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="Örn. Giriş ekranını tasarla"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "gorev-baslik-hata" : undefined}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              {error ? (
                <p id="gorev-baslik-hata" role="alert" className="text-xs font-medium text-rose-600">
                  {error}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gorev-aciklama" className="text-xs font-medium text-slate-700">
                Açıklama (isteğe bağlı)
              </label>
              <textarea
                id="gorev-aciklama"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Kısa bir açıklama ekleyin"
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Görevi ekle
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="sb-board w-full">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input
              id="pano-arama"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Görevlerde ara"
              aria-label="Görevlerde ara"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100/80 p-1" role="group" aria-label="Duruma göre filtrele">
            {(["Tümü", ...COLUMN_STATUSES] as const).map((option) => {
              const active = filter === option;
              return (
                <button
                  key={option}
                  type="button"
                  data-filter={option}
                  data-active={active ? "true" : undefined}
                  aria-current={active}
                  onClick={() => setFilter(option)}
                  className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
        <main className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-start">
          <BoardColumn
            title="Yapılacak"
            items={tasksIn("Yapılacak")}
            onAddTask={() => handleOpenChange(true)}
            onDeleteTask={handleDelete}
            onDropTask={handleMoveTask("Yapılacak")}
            statusOptions={COLUMN_STATUSES}
            onStatusChange={handleStatusChange}
          />
          <BoardColumn
            title="Devam Ediyor"
            items={tasksIn("Devam Ediyor")}
            onAddTask={() => handleOpenChange(true)}
            onDeleteTask={handleDelete}
            onDropTask={handleMoveTask("Devam Ediyor")}
            statusOptions={COLUMN_STATUSES}
            onStatusChange={handleStatusChange}
          />
          <BoardColumn
            title="Tamamlandı"
            items={tasksIn("Tamamlandı")}
            onAddTask={() => handleOpenChange(true)}
            onDeleteTask={handleDelete}
            onDropTask={handleMoveTask("Tamamlandı")}
            statusOptions={COLUMN_STATUSES}
            onStatusChange={handleStatusChange}
          />
        </main>
      </div>
      </div>
    </div>
  );
}

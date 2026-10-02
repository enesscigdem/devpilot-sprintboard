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

  const tasksIn = (status: ColumnStatus) =>
    tasks.filter(
      (task) =>
        task.status === status && (filter === "Tümü" || task.status === filter),
    );

  const countIn = (status: ColumnStatus) =>
    tasks.filter((task) => task.status === status).length;

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
        className="sb-sidebar flex flex-col gap-1 px-3 py-5 max-[900px]:flex-row max-[900px]:items-center max-[900px]:gap-2 max-[900px]:overflow-x-auto max-[900px]:px-4"
        aria-label="Görev filtreleri"
      >
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 max-[900px]:hidden">
          Panolar
        </p>
        {(["Tümü", ...COLUMN_STATUSES] as const).map((option) => {
          const active = filter === option;
          const count = option === "Tümü" ? tasks.length : countIn(option);
          return (
            <button
              key={option}
              type="button"
              data-filter={option}
              data-active={active ? "true" : undefined}
              aria-current={active}
              onClick={() => setFilter(option)}
              className="flex w-full shrink-0 items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-slate-600 hover:bg-slate-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-blue-600" : "bg-slate-300"}`}
                aria-hidden="true"
              />
              <span className="truncate">{option}</span>
              <span className="ml-auto text-[11px] tabular-nums text-slate-400">
                {count}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => handleOpenChange(true)}
          className="sb-btn-primary mt-4 flex w-full items-center gap-2 px-3 py-2 text-[13px] font-medium text-white transition max-[900px]:mt-0 max-[900px]:w-auto"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Yeni görev
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-5 md:px-8">
          <div className="flex items-center gap-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M8 9h8M8 12h8M8 15h5" /></svg>
            </span>
            <div>
              <h1 className="text-[17px] font-semibold tracking-tight text-slate-900">SprintBoard</h1>
              <p className="hidden text-xs leading-none text-slate-500 sm:block">Sprintlerinizi planlayın, önceliklendirin ve ilerlemeyi takip edin.</p>
            </div>
          </div>
                   <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500 sm:hidden">Sprint yönetimi</p>
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
        <div className="mb-8 flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Panonuz</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-500 sm:hidden">Sprintlerinizi planlayın, önceliklendirin ve ilerlemeyi takip edin.</p>
          <p className="hidden max-w-2xl text-sm leading-6 text-slate-500 sm:block">Görevlerinizi üç aşamada takip edin — sade, odaklı ve her cihazda tutarlı.</p>
        </div>
        <main className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-start">
          <BoardColumn
            title="Yapılacak"
            items={tasksIn("Yapılacak")}
            onDeleteTask={handleDelete}
            onDropTask={handleMoveTask("Yapılacak")}
            statusOptions={COLUMN_STATUSES}
            onStatusChange={handleStatusChange}
          />
          <BoardColumn
            title="Devam Ediyor"
            items={tasksIn("Devam Ediyor")}
            onDeleteTask={handleDelete}
            onDropTask={handleMoveTask("Devam Ediyor")}
            statusOptions={COLUMN_STATUSES}
            onStatusChange={handleStatusChange}
          />
          <BoardColumn
            title="Tamamlandı"
            items={tasksIn("Tamamlandı")}
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

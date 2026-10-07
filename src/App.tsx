import "./index.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronLeft, Download, FileDown, Info, Moon, Pin, RotateCcw, Search, SquarePen, StickyNote, Sun, Trash2, Upload, X } from "lucide-react";
import NoteEditor from "./components/NoteEditor";
import ConfirmDialog from "./components/ConfirmDialog";
import {
  createNote, emptyTrash, formatListDate, formatDueDate, getNoteTitle, getTrashNotes, isOverdue, groupNotes, htmlToText, importNotesFromJson, loadNotes, noteToMarkdown, notesToJson, permanentlyDeleteNote, restoreNote, sanitizeFilename, saveNotes, sortNotes, NOTE_SORT_KEY, type Note, type NoteSortOption,
} from "./lib/notes";

interface ToastNotification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

function ToastItem({ toast, onDismiss }: { toast: ToastNotification; onDismiss: (id: string) => void }) {
  const [isPaused, setIsPaused] = useState(false);
  const remainingRef = useRef(toast.duration ?? 4500);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startTimeRef.current));
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, remainingRef.current);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
    error: <AlertCircle size={18} className="text-rose-500 shrink-0" />,
    warning: <AlertTriangle size={18} className="text-amber-500 shrink-0" />,
    info: <Info size={18} className="text-blue-500 shrink-0" />,
  };

  const bgStyles = {
    success: "border-emerald-500/20 bg-white dark:bg-[#252528] text-slate-800 dark:text-slate-100",
    error: "border-rose-500/20 bg-white dark:bg-[#252528] text-slate-800 dark:text-slate-100",
    warning: "border-amber-500/20 bg-white dark:bg-[#252528] text-slate-800 dark:text-slate-100",
    info: "border-blue-500/20 bg-white dark:bg-[#252528] text-slate-800 dark:text-slate-100",
  };

  return (
    <div
      role="status"
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      className={`toast-item animate-toast-in flex items-start gap-3 p-3.5 rounded-xl border shadow-lg max-w-md w-full pointer-events-auto transition-all ${bgStyles[toast.type]}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="pt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold leading-tight">{toast.title}</div>
        {toast.description && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
            {toast.description}
          </div>
        )}
        {toast.action && (
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Kapat"
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors -mr-1 -mt-1"
        onClick={() => onDismiss(toast.id)}
      >
        <X size={15} />
      </button>
    </div>
  );
}

function normalizeText(text: string): string {
  return text.toLocaleLowerCase("tr");
}

function renderHighlightedText(text: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed || !text) return text;

  const normQuery = normalizeText(trimmed);
  const normText = normalizeText(text);
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let index = normText.indexOf(normQuery, lastIndex);

  if (index === -1) return text;

  while (index !== -1) {
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    const matchEnd = index + normQuery.length;
    parts.push(
      <mark key={index} className="search-highlight">
        {text.slice(index, matchEnd)}
      </mark>
    );
    lastIndex = matchEnd;
    index = normText.indexOf(normQuery, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function preview(note: Note, query: string = ""): string {
  const fullText = htmlToText(note.html) || "Ek metin yok";
  const trimmed = query.trim();
  if (!trimmed || fullText === "Ek metin yok") {
    return fullText;
  }
  const normText = normalizeText(fullText);
  const normQuery = normalizeText(trimmed);
  const matchIndex = normText.indexOf(normQuery);
  if (matchIndex === -1) return fullText;

  const snippetLength = 120;
  const start = Math.max(0, matchIndex - 30);
  const end = Math.min(fullText.length, start + snippetLength);
  let snippet = fullText.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < fullText.length) snippet = snippet + "...";
  return snippet;
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [draft, setDraft] = useState<Note | null>(null);
  const [currentView, setCurrentView] = useState<"notes" | "trash">("notes");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<NoteSortOption>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(NOTE_SORT_KEY);
      if (saved === "updatedAt" || saved === "createdAt" || saved === "title") {
        return saved;
      }
    }
    return "updatedAt";
  });
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const first = [...loadNotes()].filter((n) => !n.deletedAt).sort((a, b) => b.updatedAt - a.updatedAt)[0];
    return first?.id ?? null;
  });
  const [mobilePane, setMobilePane] = useState<"list" | "editor">("list");
  const [deletedNote, setDeletedNote] = useState<Note | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [importStatus, setImportStatus] = useState<{ message: string; isError?: boolean } | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isConfirmTrashOpen, setIsConfirmTrashOpen] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const removeToast = (id: string) => setToasts((prev) => prev.filter((toast) => toast.id !== id));
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    const persisted = notes.filter((n) => n.title.trim() || htmlToText(n.html));
    saveNotes(persisted);
  }, [notes]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (event.key === "Escape") {
        setShowShortcuts(false);
      }

      if (event.key === "?" && !isEditable) {
        event.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "n") {
        event.preventDefault();
        addNote();
      } else if (mod && (event.key.toLowerCase() === "k" || event.key.toLowerCase() === "f")) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const isEmpty = (n: Note) => !n.title.trim() && !htmlToText(n.html) && (!n.tags || n.tags.length === 0);

  /** Başka nota geçerken boş kalan notu temizler. */
  const select = (id: string | null) => {
    setDraft(null);
    setSelectedId(id);
    if (id) setMobilePane("editor");
  };

  const addNote = () => {
    setCurrentView("notes");
    const note = createNote();
    setDraft(note);
    setSelectedId(note.id);
    setQuery("");
    setMobilePane("editor");
  };

  const handleRestore = (id: string) => {
    setNotes((prev) => restoreNote(prev, id));
    setCurrentView("notes");
    setSelectedId(id);
  };

  const handlePermanentDelete = (id: string) => {
    if (window.confirm("Bu notu kalıcı olarak silmek istediğinize emin misiniz?")) {
      setNotes((prev) => permanentlyDeleteNote(prev, id));
      setSelectedId(null);
    }
  };

  const handleEmptyTrash = () => {
    setIsConfirmTrashOpen(true);
  };

  const handleConfirmEmptyTrash = () => {
    setNotes((prev) => emptyTrash(prev));
    setSelectedId(null);
    setIsConfirmTrashOpen(false);
  };

  const patchNote = (id: string, patch: Partial<Note>) => {
    if (draft && draft.id === id) {
      const updated = { ...draft, ...patch, updatedAt: Date.now() };
      if (updated.title.trim() || htmlToText(updated.html)) {
        setNotes((prev) => [updated, ...prev]);
        setDraft(null);
      } else {
        setDraft(updated);
      }
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));
  };

  const togglePin = (id: string) => {
    if (draft && draft.id === id) {
      setDraft((prev) => (prev ? { ...prev, pinned: !prev.pinned } : null));
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const deleteNote = (id: string) => {
    const target = notes.find((n) => n.id === id) || (draft && draft.id === id ? draft : null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    const isNonEmpty = target && (target.title.trim() || htmlToText(target.html));
    if (isNonEmpty && target) {
      const trashed = { ...target, deletedAt: Date.now() };
      setDeletedNote(trashed);
      undoTimerRef.current = setTimeout(() => {
        setDeletedNote(null);
      }, 5000);

      setDraft(null);
      setNotes((prev) => {
        const exists = prev.some((n) => n.id === id);
        if (exists) {
          return prev.map((n) => (n.id === id ? trashed : n));
        }
        return [trashed, ...prev];
      });
    } else {
      setDeletedNote(null);
      if (draft && draft.id === id) {
        setDraft(null);
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }

    const next = notes
      .filter((n) => !n.deletedAt && n.id !== id)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];
    setSelectedId(next?.id ?? null);
    if (!next) setMobilePane("list");
  };

  const handleUndo = () => {
    if (!deletedNote) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setDraft(null);
    const restored: Note = { ...deletedNote, deletedAt: undefined };
    setNotes((prev) => [restored, ...prev.filter((n) => n.id !== deletedNote.id)]);
    setSelectedId(deletedNote.id);
    setMobilePane("editor");
    setDeletedNote(null);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAllJson = () => {
    const persisted = notes.filter((n) => n.title.trim() || htmlToText(n.html));
    const json = notesToJson(persisted.length > 0 ? persisted : notes);
    downloadFile(json, "notlar.json", "application/json;charset=utf-8");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = importNotesFromJson(content, notes);
        setNotes(result.notes);
        setImportStatus({
          message: `${result.importedCount} not eklendi, ${result.skippedCount} not atlandı.`,
          isError: false,
        });
        if (result.importedCount > 0 && result.notes[0] && !result.notes[0].deletedAt) {
          setSelectedId(result.notes[0].id);
        }
      } catch (err) {
        setImportStatus({
          message: err instanceof Error ? err.message : "Notlar içe aktarılırken hata oluştu.",
          isError: true,
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
      setImportStatus({
        message: "Dosya okunamadı. Lütfen geçerli bir dosya seçin.",
        isError: true,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const exportSelectedMarkdown = () => {
    if (!selected) return;
    const md = noteToMarkdown(selected);
    const filename = `${sanitizeFilename(selected.title || "not")}.md`;
    downloadFile(md, filename, "text/markdown;charset=utf-8");
  };

  const needle = query.trim().toLocaleLowerCase("tr");
  const trashNotes = useMemo(() => getTrashNotes(notes), [notes]);
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.filter((n) => !n.deletedAt).forEach((n) => {
      n.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [notes]);

  const visible = useMemo(
    () =>
      notes.filter(
        (n) =>
          !n.deletedAt &&
          (!selectedTag || n.tags?.includes(selectedTag)) &&
          (!needle ||
            n.title.toLocaleLowerCase("tr").includes(needle) ||
            htmlToText(n.html).toLocaleLowerCase("tr").includes(needle)),
      ),
    [notes, needle, selectedTag],
  );
  const trashVisible = useMemo(
    () =>
      trashNotes.filter(
        (n) =>
          !needle ||
          n.title.toLocaleLowerCase("tr").includes(needle) ||
          htmlToText(n.html).toLocaleLowerCase("tr").includes(needle),
      ),
    [trashNotes, needle],
  );

  const activeListItems = currentView === "trash" ? trashVisible : visible;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (activeListItems.length === 0) return;
      const idx = activeListItems.findIndex((n) => n.id === selectedId);
      let nextIdx: number;
      if (e.key === "ArrowDown") {
        nextIdx = idx === -1 ? 0 : Math.min(idx + 1, activeListItems.length - 1);
      } else {
        nextIdx = idx === -1 ? activeListItems.length - 1 : Math.max(idx - 1, 0);
      }
      setSelectedId(activeListItems[nextIdx].id);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeListItems.length > 0) {
        const targetId = activeListItems.find((n) => n.id === selectedId)?.id ?? activeListItems[0].id;
        select(targetId);
        searchRef.current?.blur();
        const titleEl = document.querySelector<HTMLTextAreaElement>(".editor-title");
        titleEl?.focus();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      searchRef.current?.blur();
      if (selectedId) {
        setMobilePane("editor");
        const titleEl = document.querySelector<HTMLTextAreaElement>(".editor-title");
        titleEl?.focus();
      }
    }
  };
  const groups = useMemo(() => groupNotes(visible).map((group) => ({ ...group, notes: sortNotes(group.notes, sortBy) })), [visible, sortBy]);
  const selected = (draft && draft.id === selectedId)
    ? draft
    : (notes.find((n) => n.id === selectedId && (currentView === "trash" ? Boolean(n.deletedAt) : !n.deletedAt)) ?? null);
  const realCount = notes.filter((n) => !n.deletedAt && !isEmpty(n)).length;

  return (
    <div className="app" data-pane={mobilePane}>
      <aside className="sidebar" aria-label="Notlar">
        <header className="sidebar-header" style={{ flexWrap: "nowrap", minWidth: 0 }}>
          <div className="sidebar-title" style={{ minWidth: 0, flexShrink: 0, whiteSpace: "nowrap" }}>
            <h1 style={{ whiteSpace: "nowrap" }}>{currentView === "trash" ? "Çöp Kutusu" : "Notlar"}</h1>
            <span className="sidebar-count">{currentView === "trash" ? `${trashNotes.length} not` : `${realCount} not`}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={handleImportFile}
            />
            <button
              type="button"
              className="icon-button"
              aria-label="JSON dosyasından içe aktar"
              title="JSON dosyasından içe aktar"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={19} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Tüm notları JSON olarak indir"
              title="Tüm notları JSON olarak indir"
              onClick={exportAllJson}
            >
              <Download size={19} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Seçili notu Markdown olarak indir"
              title={selected ? "Seçili notu Markdown olarak indir" : "Not seçilmedi"}
              disabled={!selected}
              onClick={exportSelectedMarkdown}
            >
              <FileDown size={19} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
              title={theme === "dark" ? "Açık tema" : "Koyu tema"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button type="button" className="icon-button accent" aria-label="Yeni not" title="Yeni not" onClick={addNote}>
              <SquarePen size={19} />
            </button>
          </div>
        </header>
        <div className="search">
          <Search size={15} />
          <input ref={searchRef} type="search" aria-label="Notlarda ara" placeholder="Ara" value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown} />
          {query && (
            <button type="button" className="search-clear" aria-label="Aramayı temizle" onClick={() => setQuery("")}>
              <X size={13} />
            </button>
          )}
        </div>
        {currentView === "notes" && (
          <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px" }}>
            <span style={{ fontSize: "12px" }}>Sırala:</span>
            <select aria-label="Notları sırala" value={sortBy} onChange={(e) => setSortBy(e.target.value as NoteSortOption)}>
              <option value="updatedAt">Son güncellenen</option>
              <option value="createdAt">Oluşturulma tarihi</option>
              <option value="title">Başlık</option>
            </select>
          </label>
        )}
        {currentView === "notes" && allTags.length > 0 && (
          <div className="tag-filters" aria-label="Etiket filtreleri">
            <span className="tag-filters-title" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", width: "100%", marginBottom: "0.25rem", display: "block" }}>Etiketler</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-filter-chip ${selectedTag === tag ? "active" : ""}`}
                style={selectedTag === tag ? { backgroundColor: "var(--primary, #3b82f6)", color: "#ffffff", fontWeight: 600, borderColor: "var(--primary, #3b82f6)" } : undefined}
                aria-pressed={selectedTag === tag}
                onClick={() => setSelectedTag((prev) => (prev === tag ? null : tag))}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className={`trash-nav ${currentView === "trash" ? "active" : ""}`}
          aria-current={currentView === "trash" ? "true" : undefined}
          onClick={() => {
            setCurrentView((prev) => (prev === "trash" ? "notes" : "trash"));
            setDraft(null);
            setSelectedId(null);
          }}
        >
          <Trash2 size={16} />
          <span>Çöp Kutusu</span>
          {trashNotes.length > 0 && <span className="trash-nav-badge">{trashNotes.length}</span>}
        </button>
        {currentView === "trash" && trashNotes.length > 0 && (
          <div style={{ padding: "0 10px 8px", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="danger-button"
              onClick={handleEmptyTrash}
              style={{ fontSize: "12px", padding: "4px 10px" }}
            >
              <Trash2 size={13} />
              Çöp kutusunu boşalt
            </button>
          </div>
        )}
        <nav className="note-list" aria-label={currentView === "trash" ? "Çöp kutusu listesi" : "Not listesi"}>
          {currentView === "trash" ? (
            <>
              <ul>
                {trashVisible.map((note) => (
                  <li key={note.id} style={{ minWidth: 0 }}>
                    <button
                      type="button"
                      className="note-row"
                      aria-current={note.id === selectedId ? "true" : undefined}
                      onClick={() => select(note.id)}
                    >
                      <span className="note-row-title">
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>
                          {getNoteTitle(note)}
                        </span>
                      </span>
                      <span className="note-row-meta">
                        {note.deletedAt && <time className="trash-date">{formatListDate(note.deletedAt)}</time>}
                        <span className="note-row-preview">{preview(note)}</span>
                      </span>
                      {note.tags && note.tags.length > 0 && (
                        <span className="note-tags">
                          {note.tags.map((tag) => (
                            <span key={tag} className="note-tag">#{tag}</span>
                          ))}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              {trashVisible.length === 0 && (
                <p className="list-empty">{needle ? "Eşleşen silinen not yok" : "Çöp kutusu boş"}</p>
              )}
            </>
          ) : (
            <>
              {groups.map((group) => (
                <section key={group.label} aria-label={group.label}>
                  <h2 className="group-label">{group.label}</h2>
                  <ul>
                    {group.notes.map((note) => (
                      <li key={note.id} style={{ minWidth: 0 }}>
                        <button type="button" className="note-row" aria-current={note.id === selectedId ? "true" : undefined}
                          onClick={() => select(note.id)}>
                          <span className="note-row-title">
                            {note.pinned && <Pin size={12} className="pin-mark" aria-label="Sabitlenmiş" />}
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>
                              {renderHighlightedText(getNoteTitle(note), query)}
                            </span>
                            {note.dueDate && (
                              <span className="due-date-badge" style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: isOverdue(note.dueDate) ? "var(--due-badge-bg)" : "var(--hover)",
                                color: isOverdue(note.dueDate) ? "var(--due-overdue)" : "var(--text-2)",
                                marginLeft: "auto",
                                flexShrink: 0
                              }}>
                                {formatDueDate(note.dueDate)}
                              </span>
                            )}
                          </span>
                          <span className="note-row-meta">
                            <time>{formatListDate(note.updatedAt)}</time>
                            <span className="note-row-preview">{renderHighlightedText(preview(note, query), query)}</span>
                          </span>
                          {note.tags && note.tags.length > 0 && (
                            <span className="note-tags">
                              {note.tags.map((tag) => (
                                <span key={tag} className="note-tag">#{tag}</span>
                              ))}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {groups.length === 0 && (
                <p className="list-empty">{needle ? "Eşleşen not yok" : "Henüz not yok"}</p>
              )}
            </>
          )}
        </nav>
      </aside>

      <main className="detail">
        {selected ? (
          <>
            <button type="button" className="back-button" onClick={() => {
              setDraft(null);
              if (draft && selectedId === draft.id) {
                const next = [...notes].filter((n) => !n.deletedAt).sort((a, b) => b.updatedAt - a.updatedAt)[0];
                setSelectedId(next?.id ?? null);
              }
              setMobilePane("list");
            }}>
              <ChevronLeft size={20} />{currentView === "trash" ? "Çöp Kutusu" : "Notlar"}
            </button>
            {selected.deletedAt && (
              <div className="trash-banner">
                <p>Bu not çöp kutusunda.</p>
                <div className="trash-actions">
                  <button type="button" className="secondary-button" onClick={() => handleRestore(selected.id)}>
                    <RotateCcw size={14} />Geri Yükle
                  </button>
                  <button type="button" className="danger-button" onClick={() => handlePermanentDelete(selected.id)}>
                    <Trash2 size={14} />Kalıcı Olarak Sil
                  </button>
                </div>
              </div>
            )}
            <NoteEditor
              key={selected.id}
              note={selected}
              onChange={(patch) => {
                if (!selected.deletedAt) patchNote(selected.id, patch);
              }}
              onTogglePin={() => {
                if (!selected.deletedAt) togglePin(selected.id);
              }}
              onDelete={() => {
                if (selected.deletedAt) {
                  handlePermanentDelete(selected.id);
                } else {
                  deleteNote(selected.id);
                }
              }}
            />
          </>
        ) : (
          <div className="detail-empty">
            {currentView === "trash" ? (
              <>
                <Trash2 size={44} strokeWidth={1.4} />
                <h2>Çöp Kutusu</h2>
                <p>Silinen notları görüntülemek veya geri yüklemek için soldan bir not seçin.</p>
              </>
            ) : (
              <>
                <StickyNote size={44} strokeWidth={1.4} />
                <h2>Not seçilmedi</h2>
                <p>Soldan bir not seç veya yeni bir not oluştur.</p>
                <button type="button" className="primary-button" onClick={addNote}>
                  <SquarePen size={16} />Yeni not
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {deletedNote && (
        <div className="undo-toast" role="status">
          <span>Not silindi</span>
          <button type="button" className="undo-button" onClick={handleUndo}>
            Geri Al
          </button>
        </div>
      )}

      {importStatus && (
        <div className="undo-toast" role="status">
          <span>{importStatus.message}</span>
          <button type="button" className="undo-button" onClick={() => setImportStatus(null)}>
            Kapat
          </button>
        </div>
      )}

      {showShortcuts && (
        <div className="shortcuts-backdrop" onClick={() => setShowShortcuts(false)}>
          <div
            className="shortcuts-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-heading"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shortcuts-header">
              <h2 id="shortcuts-heading" className="shortcuts-title">Klavye Kısayolları</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Kapat"
                onClick={() => setShowShortcuts(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="shortcuts-body">
              <div className="shortcut-row">
                <span className="shortcut-label">Yeni not oluştur</span>
                <div className="shortcut-keys"><kbd>⌘ / Ctrl</kbd><kbd>N</kbd></div>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-label">Notlarda ara</span>
                <div className="shortcut-keys"><kbd>⌘ / Ctrl</kbd><kbd>K</kbd></div>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-label">Kısayol yardımı</span>
                <div className="shortcut-keys"><kbd>?</kbd></div>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-label">Pencereyi kapat / Aramadan çık</span>
                <div className="shortcut-keys"><kbd>Esc</kbd></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isConfirmTrashOpen}
        title="Çöp Kutusunu Boşalt"
        message="Çöp kutusundaki tüm notlar kalıcı olarak silinecektir. Bu işlem geri alınamaz. Emin misiniz?"
        confirmText="Çöpü Boşalt"
        cancelText="İptal"
        onConfirm={handleConfirmEmptyTrash}
        onClose={() => setIsConfirmTrashOpen(false)}
      />

      <aside className="toast-container" aria-label="Bildirimler" aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </aside>
    </div>
  );
}

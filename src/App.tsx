import "./index.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronLeft, Download, FileDown, Folder as FolderIcon, FolderPlus, Info, Moon, Pencil, Pin, Search, SquarePen, StickyNote, Sun, Trash2, Upload, X } from "lucide-react";
import NoteEditor from "./components/NoteEditor";
import ConfirmDialog from "./components/ConfirmDialog";
import {
  createFolder, createNote, emptyTrash, formatListDate, formatDueDate, getNoteTitle, getTrashNotes, isOverdue, groupNotes, htmlToText, importNotesFromJson, loadFolders, loadNotes, noteToMarkdown, notesToJson, permanentlyDeleteNote, restoreNote, sanitizeFilename, saveFolders, saveNotes, sortNotes, NOTE_SORT_KEY, type Folder, type Note, type NoteSortOption,
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
  const [isExiting, setIsExiting] = useState(false);
  const totalDuration = toast.duration ?? 3500;
  const [remaining, setRemaining] = useState(totalDuration);
  const isExitingRef = useRef(false);

  const handleDismiss = () => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 240);
  };

  useEffect(() => {
    if (isPaused || isExiting) return;

    const interval = 20;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - interval;
        if (next <= 0) {
          clearInterval(timer);
          handleDismiss();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, isExiting]);

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

  const progressColors = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };

  const progressPercent = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));

  return (
    <div
      role="status"
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      className={`toast-item ${isExiting ? "animate-toast-out" : "animate-toast-in"} relative overflow-hidden flex flex-col p-3.5 rounded-xl border shadow-lg max-w-md w-full pointer-events-auto transition-all ${bgStyles[toast.type]}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-start gap-3 w-full">
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
                handleDismiss();
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
          onClick={handleDismiss}
        >
          <X size={15} />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/10 overflow-hidden">
        <div
          className={`h-full toast-progress ${progressColors[toast.type]}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
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

function renderNoteTags(tags?: string[]) {
  if (!tags || tags.length === 0) return null;
  const maxDisplay = 3;
  const visibleTags = tags.slice(0, maxDisplay);
  const remaining = tags.length - maxDisplay;
  return (
    <span className="note-tags">
      {visibleTags.map((tag) => (
        <span key={tag} className="note-tag">#{tag}</span>
      ))}
      {remaining > 0 && (
        <span className="note-tag note-tag-overflow">+{remaining}</span>
      )}
    </span>
  );
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
  const [folders, setFolders] = useState<Folder[]>(loadFolders);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
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
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isConfirmTrashOpen, setIsConfirmTrashOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [trashTargetId, setTrashTargetId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const removeToast = (id: string) => setToasts((prev) => prev.filter((toast) => toast.id !== id));
  const showToast = (toast: Omit<ToastNotification, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id, duration: toast.duration ?? 3500 }]);
    return id;
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    try {
      const persisted = notes.filter((n) => n.title.trim() || htmlToText(n.html));
      saveNotes(persisted);
    } catch {
      showToast({
        type: "error",
        title: "Kaydetme hatası",
        description: "Notlar kaydedilirken bir hata oluştu.",
      });
    }
  }, [notes]);

  useEffect(() => {
    try {
      saveFolders(folders);
    } catch {
      // depolama hatası yoksayılır
    }
  }, [folders]);

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
    const note = createNote(Date.now(), selectedFolderId ?? undefined);
    setDraft(note);
    setSelectedId(note.id);
    setQuery("");
    setMobilePane("editor");
  };

  const handleCreateFolder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newFolderName.trim();
    if (!name) {
      showToast({ type: "warning", title: "Lütfen bir klasör adı girin." });
      return;
    }
    const folder = createFolder(name);
    setFolders((prev) => [...prev, folder]);
    setNewFolderName("");
    setIsCreatingFolder(false);
    setSelectedFolderId(folder.id);
    showToast({ type: "success", title: `"${folder.name}" klasörü oluşturuldu` });
  };

  const handleRenameFolder = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast({ type: "warning", title: "Klasör adı boş olamaz." });
      return;
    }
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name: trimmed } : f)));
    setEditingFolderId(null);
    setEditingFolderName("");
    showToast({ type: "success", title: "Klasör yeniden adlandırıldı" });
  };

  const handleDeleteFolder = (folder: Folder) => {
    setFolders((prev) => prev.filter((f) => f.id !== folder.id));
    setNotes((prev) => prev.map((n) => (n.folderId === folder.id ? { ...n, folderId: undefined } : n)));
    if (selectedFolderId === folder.id) {
      setSelectedFolderId(null);
    }
    setFolderToDelete(null);
    showToast({ type: "info", title: `"${folder.name}" klasörü silindi` });
  };

  const handleRestore = (id: string) => {
    setNotes((prev) => restoreNote(prev, id));
    setCurrentView("notes");
    setSelectedId(id);
    showToast({ type: "success", title: "Not geri yüklendi" });
  };

  const handlePermanentDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleEmptyTrash = () => {
    setIsConfirmTrashOpen(true);
  };

  const handleConfirmEmptyTrash = () => {
    setNotes((prev) => emptyTrash(prev));
    setSelectedId(null);
    setIsConfirmTrashOpen(false);
    showToast({ type: "info", title: "Çöp kutusu boşaltıldı" });
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
    const target = notes.find((n) => n.id === id) || (draft && draft.id === id ? draft : null);
    const willPin = target ? !target.pinned : false;
    if (draft && draft.id === id) {
      setDraft((prev) => (prev ? { ...prev, pinned: !prev.pinned } : null));
    } else {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
    }
    showToast({
      type: "info",
      title: willPin ? "Not sabitlendi" : "Sabitleme kaldırıldı",
    });
  };

  const deleteNote = (id: string) => {
    const target = notes.find((n) => n.id === id) || (draft && draft.id === id ? draft : null);
    const isNonEmpty = target && (target.title.trim() || htmlToText(target.html));
    if (isNonEmpty && target) {
      const trashed: Note = { ...target, deletedAt: Date.now() };
      setDraft(null);
      setNotes((prev) => {
        const exists = prev.some((n) => n.id === id);
        if (exists) {
          return prev.map((n) => (n.id === id ? trashed : n));
        }
        return [trashed, ...prev];
      });
      showToast({
        type: "info",
        title: "Not çöpe taşındı",
        duration: 4000,
        action: {
          label: "Geri Al",
          onClick: () => {
            setDraft(null);
            const restored: Note = { ...trashed, deletedAt: undefined };
            setNotes((prev) => [restored, ...prev.filter((n) => n.id !== trashed.id)]);
            setSelectedId(trashed.id);
            setMobilePane("editor");
            showToast({ type: "success", title: "Not geri yüklendi" });
          },
        },
      });
    } else {
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
    try {
      const persisted = notes.filter((n) => n.title.trim() || htmlToText(n.html));
      const json = notesToJson(persisted.length > 0 ? persisted : notes);
      downloadFile(json, "notlar.json", "application/json;charset=utf-8");
      showToast({ type: "success", title: "Notlar JSON olarak dışa aktarıldı" });
    } catch {
      showToast({ type: "error", title: "Dışa aktarma başarısız oldu" });
    }
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
        showToast({
          type: "success",
          title: "İçe aktarma tamamlandı",
          description: `${result.importedCount} not eklendi, ${result.skippedCount} not atlandı.`,
        });
        if (result.importedCount > 0 && result.notes[0] && !result.notes[0].deletedAt) {
          setSelectedId(result.notes[0].id);
        }
      } catch (err) {
        showToast({
          type: "error",
          title: "İçe aktarma hatası",
          description: err instanceof Error ? err.message : "Notlar içe aktarılırken hata oluştu.",
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
      showToast({
        type: "error",
        title: "Dosya okunamadı",
        description: "Lütfen geçerli bir dosya seçin.",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const exportSelectedMarkdown = () => {
    if (!selected) return;
    try {
      const md = noteToMarkdown(selected);
      const filename = `${sanitizeFilename(selected.title || "not")}.md`;
      downloadFile(md, filename, "text/markdown;charset=utf-8");
      showToast({ type: "success", title: "Not Markdown olarak dışa aktarıldı" });
    } catch {
      showToast({ type: "error", title: "Dışa aktarma başarısız oldu" });
    }
  };

  const needle = query.trim().toLocaleLowerCase("tr");
  const trashNotes = useMemo(() => getTrashNotes(notes), [notes]);
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    notes.filter((n) => !n.deletedAt).forEach((n) => {
      n.tags?.forEach((t) => {
        counts.set(t, (counts.get(t) || 0) + 1);
      });
    });
    return counts;
  }, [notes]);

  const allTags = useMemo(() => {
    return Array.from(tagCounts.keys()).sort((a, b) => {
      const countDiff = (tagCounts.get(b) || 0) - (tagCounts.get(a) || 0);
      if (countDiff !== 0) return countDiff;
      return a.localeCompare(b, "tr");
    });
  }, [tagCounts]);

  const visible = useMemo(
    () =>
      notes.filter(
        (n) =>
          !n.deletedAt &&
          (!selectedFolderId || n.folderId === selectedFolderId) &&
          (!selectedTag || n.tags?.includes(selectedTag)) &&
          (!needle ||
            n.title.toLocaleLowerCase("tr").includes(needle) ||
            htmlToText(n.html).toLocaleLowerCase("tr").includes(needle)),
      ),
    [notes, needle, selectedTag, selectedFolderId],
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
        <div className="sidebar-tabs" role="tablist" style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "8px 10px 0", gap: "4px" }}>
          <button
            type="button"
            role="tab"
            aria-selected={currentView === "notes"}
            className={`sidebar-tab ${currentView === "notes" ? "active" : ""}`}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              borderBottom: currentView === "notes" ? "2px solid var(--primary, #3b82f6)" : "2px solid transparent",
              background: "none",
              color: currentView === "notes" ? "var(--text)" : "var(--text-2)",
              cursor: "pointer",
            }}
            onClick={() => {
              if (currentView !== "notes") {
                setCurrentView("notes");
                setDraft(null);
                const first = notes.filter((n) => !n.deletedAt).sort((a, b) => b.updatedAt - a.updatedAt)[0];
                setSelectedId(first?.id ?? null);
              }
            }}
          >
            Notlar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={currentView === "trash"}
            className={`sidebar-tab ${currentView === "trash" ? "active" : ""}`}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              borderBottom: currentView === "trash" ? "2px solid var(--primary, #3b82f6)" : "2px solid transparent",
              background: "none",
              color: currentView === "trash" ? "var(--text)" : "var(--text-2)",
              cursor: "pointer",
            }}
            onClick={() => {
              if (currentView !== "trash") {
                setCurrentView("trash");
                setDraft(null);
                const firstTrash = trashNotes[0];
                setSelectedId(firstTrash?.id ?? null);
              }
            }}
          >
            Çöp Kutusu
          </button>
        </div>
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
            {currentView === "notes" && (
              <>
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
              </>
            )}
            <button
              type="button"
              className="icon-button"
              aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
              title={theme === "dark" ? "Açık tema" : "Koyu tema"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            {currentView === "notes" && (
              <button type="button" className="icon-button accent" aria-label="Yeni not" title="Yeni not" onClick={addNote}>
                <SquarePen size={19} />
              </button>
            )}
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
          <div className="sidebar-folders" style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-2)" }}>Klasörler</span>
              <button
                type="button"
                className="icon-button"
                aria-label="Yeni Klasör Ekle"
                title="Yeni Klasör"
                style={{ width: "24px", height: "24px", padding: 0 }}
                onClick={() => setIsCreatingFolder((prev) => !prev)}
              >
                <FolderPlus size={14} />
              </button>
            </div>
            {isCreatingFolder && (
              <form onSubmit={handleCreateFolder} style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                <input
                  type="text"
                  autoFocus
                  placeholder="Klasör adı..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  style={{ flex: 1, fontSize: "12px", padding: "3px 6px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--hover)", color: "var(--text)" }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsCreatingFolder(false);
                      setNewFolderName("");
                    }
                  }}
                />
                <button type="submit" className="primary-button" style={{ fontSize: "11px", padding: "2px 8px", height: "auto" }}>Ekle</button>
                <button type="button" className="icon-button" onClick={() => setIsCreatingFolder(false)} style={{ width: "24px", height: "24px", padding: 0 }}><X size={13} /></button>
              </form>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <button
                type="button"
                className={`folder-item ${selectedFolderId === null ? "active" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: selectedFolderId === null ? 600 : 400,
                  background: selectedFolderId === null ? "var(--hover)" : "transparent",
                  color: "var(--text)",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
                onClick={() => setSelectedFolderId(null)}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <StickyNote size={14} style={{ opacity: 0.7 }} />
                  <span>Tüm Notlar</span>
                </span>
                <span style={{ fontSize: "11px", opacity: 0.6 }}>{notes.filter((n) => !n.deletedAt).length}</span>
              </button>
              {folders.map((folder) => {
                const count = notes.filter((n) => !n.deletedAt && n.folderId === folder.id).length;
                const isEditing = editingFolderId === folder.id;
                const isSelected = selectedFolderId === folder.id;
                if (isEditing) {
                  return (
                    <div key={folder.id} style={{ display: "flex", gap: "4px", padding: "2px 0" }}>
                      <input
                        type="text"
                        autoFocus
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        style={{ flex: 1, fontSize: "12px", padding: "2px 6px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--hover)", color: "var(--text)" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameFolder(folder.id, editingFolderName);
                          if (e.key === "Escape") setEditingFolderId(null);
                        }}
                      />
                      <button
                        type="button"
                        className="primary-button"
                        style={{ fontSize: "11px", padding: "2px 6px", height: "auto" }}
                        onClick={() => handleRenameFolder(folder.id, editingFolderName)}
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        style={{ width: "22px", height: "22px", padding: 0 }}
                        onClick={() => setEditingFolderId(null)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                }
                return (
                  <div
                    key={folder.id}
                    className={`folder-item-row group ${isSelected ? "active" : ""}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: isSelected ? 600 : 400,
                      background: isSelected ? "var(--hover)" : "transparent",
                      color: "var(--text)",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <FolderIcon size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{folder.name}</span>
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
                      <span style={{ fontSize: "11px", opacity: 0.6, marginRight: "4px" }}>{count}</span>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Yeniden adlandır: ${folder.name}`}
                        title="Yeniden adlandır"
                        style={{ width: "20px", height: "20px", padding: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolderId(folder.id);
                          setEditingFolderName(folder.name);
                        }}
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Sil: ${folder.name}`}
                        title="Klasörü sil"
                        style={{ width: "20px", height: "20px", padding: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderToDelete(folder);
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {currentView === "notes" && (
          <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px" }}>
            <span style={{ fontSize: "12px" }}>Sırala:</span>
            <select
              aria-label="Notları sırala"
              className="appearance-none h-[34px] rounded-[9px] border-0 bg-[var(--hover)] px-2.5 text-sm text-[var(--text)] cursor-pointer outline-none focus:ring-2 focus:ring-[var(--focus)]"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as NoteSortOption)}
            >
              <option value="updatedAt">Son güncellenen</option>
              <option value="createdAt">Oluşturulma tarihi</option>
              <option value="title">Başlık</option>
            </select>
          </label>
        )}
        {currentView === "notes" && allTags.length > 0 && (
          <div
            className="tag-filters"
            aria-label="Etiket filtreleri"
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            style={{
              display: "flex",
              flexWrap: "nowrap",
              overflowX: "auto",
              gap: "6px",
              padding: "4px 10px 8px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {allTags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  className={`tag-filter-chip ${isSelected ? "active" : ""}`}
                  style={{
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap",
                    ...(isSelected
                      ? {
                          backgroundColor: "var(--primary, #3b82f6)",
                          color: "#ffffff",
                          fontWeight: 600,
                          borderColor: "var(--primary, #3b82f6)",
                        }
                      : {}),
                  }}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedTag((prev) => (prev === tag ? null : tag))}
                >
                  <span>#{tag}</span>
                  {isSelected && (
                    <span
                      aria-label="Filtreyi kaldır"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                      }}
                    >
                      <X size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {currentView === "trash" && trashNotes.length > 0 && (
          <div style={{ padding: "0 10px 8px", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="danger-button min-h-[36px]"
              onClick={handleEmptyTrash}
              style={{ fontSize: "12px", padding: "4px 10px", minHeight: "36px" }}
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
                      {renderNoteTags(note.tags)}
                    </button>
                  </li>
                ))}
              </ul>
              {trashVisible.length === 0 && (
                <div className="list-empty">
                  <Trash2 size={24} style={{ opacity: 0.5, margin: "0 auto 6px" }} />
                  <p style={{ margin: 0, fontWeight: 500 }}>{needle ? "Eşleşen silinen not yok" : "Çöp kutusu boş"}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.7 }}>{needle ? "Farklı bir arama terimi deneyin." : "Silinen notlar burada görünür."}</p>
                </div>
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
                          {renderNoteTags(note.tags)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {groups.length === 0 && (
                <div className="list-empty">
                  <StickyNote size={24} style={{ opacity: 0.5, margin: "0 auto 6px" }} />
                  <p style={{ margin: 0, fontWeight: 500 }}>{needle ? "Eşleşen not yok" : "Henüz not yok"}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.7 }}>{needle ? "Farklı bir arama terimi deneyin." : "Yeni bir not oluşturarak başlayın."}</p>
                </div>
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
            <NoteEditor
              key={selected.id}
              note={selected}
              folders={folders}
              isTrash={Boolean(selected.deletedAt)}
              onRestore={() => handleRestore(selected.id)}
              onPermanentDelete={() => handlePermanentDelete(selected.id)}
              onChange={(patch) => {
                if (!selected.deletedAt) {
                  patchNote(selected.id, { ...patch, folderId: patch.folderId ?? undefined });
                }
              }}
              onTogglePin={() => {
                if (!selected.deletedAt) togglePin(selected.id);
              }}
              onDelete={() => {
                if (selected.deletedAt) {
                  handlePermanentDelete(selected.id);
                } else {
                  setTrashTargetId(selected.id);
                }
              }}
              onToast={(msg) => {
                const isWarning = msg.includes("geçerli") || msg.includes("uzun") || msg.includes("içeremez") || msg.includes("zaten") || msg.includes("hata");
                showToast({
                  type: isWarning ? "warning" : "success",
                  title: msg,
                });
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
                <span className="shortcut-label">Tüm notlar</span>
                <div className="shortcut-keys"><kbd>G</kbd><kbd>A</kbd></div>
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
        isOpen={Boolean(folderToDelete)}
        title="Klasörü Sil"
        message={folderToDelete ? `"${folderToDelete.name}" klasörünü silmek istediğinize emin misiniz? Klasördeki notlar silinmez, klasörsüz olarak saklanır.` : ""}
        confirmText="Klasörü Sil"
        cancelText="Vazgeç"
        onConfirm={() => {
          if (folderToDelete) {
            handleDeleteFolder(folderToDelete);
          }
        }}
        onClose={() => setFolderToDelete(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(trashTargetId)}
        title="Notu Sil"
        message="Bu not çöp kutusuna taşınacak."
        confirmText="Sil"
        cancelText="Vazgeç"
        onConfirm={() => {
          if (trashTargetId) {
            deleteNote(trashTargetId);
            setTrashTargetId(null);
          }
        }}
        onClose={() => setTrashTargetId(null)}
      />

      <ConfirmDialog
        isOpen={isConfirmTrashOpen}
        title="Çöp Kutusunu Boşalt"
        message="Çöp kutusundaki tüm notlar kalıcı olarak silinecektir. Bu işlem geri alınamaz. Emin misiniz?"
        confirmText="Çöpü Boşalt"
        cancelText="İptal"
        onConfirm={handleConfirmEmptyTrash}
        onClose={() => setIsConfirmTrashOpen(false)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Notu Kalıcı Olarak Sil"
        message="Bu not kalıcı olarak silinecektir. Bu işlem geri alınamaz. Emin misiniz?"
        confirmText="Kalıcı Olarak Sil"
        cancelText="İptal"
        onConfirm={() => {
          if (deleteTargetId) {
            setNotes((prev) => permanentlyDeleteNote(prev, deleteTargetId));
            setSelectedId(null);
            setDeleteTargetId(null);
            showToast({ type: "info", title: "Not kalıcı olarak silindi" });
          }
        }}
        onClose={() => setDeleteTargetId(null)}
      />

      <aside className="toast-container" aria-label="Bildirimler" aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </aside>
    </div>
  );
}

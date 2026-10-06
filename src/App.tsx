import "./index.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Download, FileDown, Moon, Pin, Search, SquarePen, StickyNote, Sun, Upload, X } from "lucide-react";
import NoteEditor from "./components/NoteEditor";
import {
  createNote, formatListDate, formatDueDate, isOverdue, groupNotes, htmlToText, importNotesFromJson, loadNotes, noteToMarkdown, notesToJson, sanitizeFilename, saveNotes, type Note,
} from "./lib/notes";

const preview = (note: Note) => {
  const text = htmlToText(note.html);
  return text || "Ek metin yok";
};

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
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const first = [...loadNotes()].sort((a, b) => b.updatedAt - a.updatedAt)[0];
    return first?.id ?? null;
  });
  const [mobilePane, setMobilePane] = useState<"list" | "editor">("list");
  const [deletedNote, setDeletedNote] = useState<Note | null>(null);
  const [importStatus, setImportStatus] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
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

  const isEmpty = (n: Note) => !n.title.trim() && !htmlToText(n.html);

  /** Başka nota geçerken boş kalan notu temizler. */
  const select = (id: string | null) => {
    setDraft(null);
    setSelectedId(id);
    if (id) setMobilePane("editor");
  };

  const addNote = () => {
    const note = createNote();
    setDraft(note);
    setSelectedId(note.id);
    setQuery("");
    setMobilePane("editor");
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

    if (target && (target.title.trim() || htmlToText(target.html))) {
      setDeletedNote(target);
      undoTimerRef.current = setTimeout(() => {
        setDeletedNote(null);
      }, 5000);
    } else {
      setDeletedNote(null);
    }

    if (draft && draft.id === id) {
      setDraft(null);
      const next = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setSelectedId(next?.id ?? null);
      if (!next) setMobilePane("list");
      return;
    }
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    const next = [...remaining].sort((a, b) => b.updatedAt - a.updatedAt)[0];
    setSelectedId(next?.id ?? null);
    if (!next) setMobilePane("list");
  };

  const handleUndo = () => {
    if (!deletedNote) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setDraft(null);
    setNotes((prev) => [deletedNote, ...prev.filter((n) => n.id !== deletedNote.id)]);
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

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== "string") {
          throw new Error("Dosya okunamadı.");
        }
        const result = importNotesFromJson(text, notes);
        setNotes(result.notes);
        if (result.added > 0 && !selectedId) {
          const first = [...result.notes].sort((a, b) => b.updatedAt - a.updatedAt)[0];
          if (first) setSelectedId(first.id);
        }
        setImportStatus({
          type: "success",
          message: `${result.added} not eklendi, ${result.skipped} not atlandı.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Notlar içe aktarılırken bir hata oluştu.";
        setImportStatus({ type: "error", message: msg });
      }
    };
    reader.onerror = () => {
      setImportStatus({ type: "error", message: "Dosya okunurken bir hata oluştu." });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (!importStatus) return;
    const timer = setTimeout(() => {
      setImportStatus(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [importStatus]);

  const exportAllJson = () => {
    const persisted = notes.filter((n) => n.title.trim() || htmlToText(n.html));
    const json = notesToJson(persisted.length > 0 ? persisted : notes);
    downloadFile(json, "notlar.json", "application/json;charset=utf-8");
  };

  const exportSelectedMarkdown = () => {
    if (!selected) return;
    const md = noteToMarkdown(selected);
    const filename = `${sanitizeFilename(selected.title || "not")}.md`;
    downloadFile(md, filename, "text/markdown;charset=utf-8");
  };

  const needle = query.trim().toLocaleLowerCase("tr");
  const visible = useMemo(
    () => notes.filter((n) => !needle || n.title.toLocaleLowerCase("tr").includes(needle) || htmlToText(n.html).toLocaleLowerCase("tr").includes(needle)),
    [notes, needle],
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (visible.length === 0) return;
      const idx = visible.findIndex((n) => n.id === selectedId);
      let nextIdx: number;
      if (e.key === "ArrowDown") {
        nextIdx = idx === -1 ? 0 : Math.min(idx + 1, visible.length - 1);
      } else {
        nextIdx = idx === -1 ? visible.length - 1 : Math.max(idx - 1, 0);
      }
      setSelectedId(visible[nextIdx].id);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (visible.length > 0) {
        const targetId = visible.find((n) => n.id === selectedId)?.id ?? visible[0].id;
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
  const groups = useMemo(() => groupNotes(visible), [visible]);
  const selected = (draft && draft.id === selectedId) ? draft : (notes.find((n) => n.id === selectedId) ?? null);
  const realCount = notes.filter((n) => !isEmpty(n)).length;

  return (
    <div className="app" data-pane={mobilePane}>
      <aside className="sidebar" aria-label="Notlar">
        <header className="sidebar-header">
          <div className="sidebar-title">
            <h1>Notlar</h1>
            <span className="sidebar-count">{realCount} not</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              aria-label="JSON dosyası seç"
              onChange={handleFileImport}
            />
            <button
              type="button"
              className="icon-button"
              aria-label="JSON dosyasından notları içe aktar"
              title="JSON dosyasından notları içe aktar"
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
        <nav className="note-list" aria-label="Not listesi">
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
                          {note.title.trim() || "Yeni Not"}
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
                        <span className="note-row-preview">{preview(note)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {groups.length === 0 && (
            <p className="list-empty">{needle ? "Eşleşen not yok" : "Henüz not yok"}</p>
          )}
        </nav>
      </aside>

      <main className="detail">
        {selected ? (
          <>
            <button type="button" className="back-button" onClick={() => {
              setDraft(null);
              if (draft && selectedId === draft.id) {
                const next = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)[0];
                setSelectedId(next?.id ?? null);
              }
              setMobilePane("list");
            }}>
              <ChevronLeft size={20} />Notlar
            </button>
            <NoteEditor
              key={selected.id}
              note={selected}
              onChange={(patch) => patchNote(selected.id, patch)}
              onTogglePin={() => togglePin(selected.id)}
              onDelete={() => deleteNote(selected.id)}
            />
          </>
        ) : (
          <div className="detail-empty">
            <StickyNote size={44} strokeWidth={1.4} />
            <h2>Not seçilmedi</h2>
            <p>Soldan bir not seç veya yeni bir not oluştur.</p>
            <button type="button" className="primary-button" onClick={addNote}>
              <SquarePen size={16} />Yeni not
            </button>
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
        <div className="undo-toast" role={importStatus.type === "error" ? "alert" : "status"}>
          <span>{importStatus.message}</span>
          <button type="button" className="undo-button" onClick={() => setImportStatus(null)}>
            Kapat
          </button>
        </div>
      )}
    </div>
  );
}

import "./index.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Pin, Search, SquarePen, StickyNote, X } from "lucide-react";
import NoteEditor from "./components/NoteEditor";
import {
  createNote, formatListDate, formatDueDate, isOverdue, groupNotes, htmlToText, loadNotes, saveNotes, type Note,
} from "./lib/notes";

const preview = (note: Note) => {
  const text = htmlToText(note.html);
  return text || "Ek metin yok";
};

export default function App() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const first = [...loadNotes()].sort((a, b) => b.updatedAt - a.updatedAt)[0];
    return first?.id ?? null;
  });
  const [mobilePane, setMobilePane] = useState<"list" | "editor">("list");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const persisted = notes.filter((n) => n.title.trim() || htmlToText(n.html));
    saveNotes(persisted);
  }, [notes]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isEmpty = (n: Note) => !n.title.trim() && !htmlToText(n.html);

  /** Başka nota geçerken boş kalan notu temizler. */
  const select = (id: string | null) => {
    setNotes((prev) => prev.filter((n) => n.id === id || !isEmpty(n)));
    setSelectedId(id);
    if (id) setMobilePane("editor");
  };

  const addNote = () => {
    const existingEmpty = notes.find(isEmpty);
    if (existingEmpty) {
      setSelectedId(existingEmpty.id);
    } else {
      const note = createNote();
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
    }
    setQuery("");
    setMobilePane("editor");
  };

  const patchNote = (id: string, patch: { title?: string; html?: string }) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));

  const togglePin = (id: string) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));

  const deleteNote = (id: string) => {
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    const next = [...remaining].sort((a, b) => b.updatedAt - a.updatedAt)[0];
    setSelectedId(next?.id ?? null);
    if (!next) setMobilePane("list");
  };

  const needle = query.trim().toLocaleLowerCase("tr");
  const visible = useMemo(
    () => notes.filter((n) => !needle || n.title.toLocaleLowerCase("tr").includes(needle) || htmlToText(n.html).toLocaleLowerCase("tr").includes(needle)),
    [notes, needle],
  );
  const groups = useMemo(() => groupNotes(visible), [visible]);
  const selected = notes.find((n) => n.id === selectedId) ?? null;
  const realCount = notes.filter((n) => !isEmpty(n)).length;

  return (
    <div className="app" data-pane={mobilePane}>
      <aside className="sidebar" aria-label="Notlar">
        <header className="sidebar-header">
          <div className="sidebar-title">
            <h1>Notlar</h1>
            <span className="sidebar-count">{realCount} not</span>
          </div>
          <button type="button" className="icon-button accent" aria-label="Yeni not" title="Yeni not" onClick={addNote}>
            <SquarePen size={19} />
          </button>
        </header>
        <div className="search">
          <Search size={15} />
          <input ref={searchRef} type="search" aria-label="Notlarda ara" placeholder="Ara" value={query}
            onChange={(e) => setQuery(e.target.value)} />
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
                  <li key={note.id}>
                    <button type="button" className="note-row" aria-current={note.id === selectedId ? "true" : undefined}
                      onClick={() => select(note.id)}>
                      <span className="note-row-title">
                        {note.pinned && <Pin size={12} className="pin-mark" aria-label="Sabitlenmiş" />}
                        {note.title.trim() || "Yeni Not"}
                        {note.dueDate && (
                          <span className="due-date-badge" style={{
                            fontSize: "11px",
                            fontWeight: 500,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: isOverdue(note.dueDate) ? "var(--due-badge-bg)" : "var(--hover)",
                            color: isOverdue(note.dueDate) ? "var(--due-overdue)" : "var(--text-2)",
                            marginLeft: "auto"
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
            <button type="button" className="back-button" onClick={() => setMobilePane("list")}>
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
    </div>
  );
}

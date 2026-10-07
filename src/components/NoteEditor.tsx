import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, ListChecks, Quote, Code, Link2, Minus,
  Pin, PinOff, Trash2, Undo2, Redo2, X,
} from "lucide-react";
import { formatFullDate, sanitizeHtml, wordCount, type Note } from "@/lib/notes";

type TagSuggestion = { name: string; count?: number } | string;

type Props = {
  note: Note;
  onChange: (patch: { title?: string; html?: string; tags?: string[] }) => void;
  onTogglePin: () => void;
  onDelete: () => void;
  allTags?: TagSuggestion[] | Record<string, number>;
  suggestions?: TagSuggestion[] | Record<string, number>;
};

type Active = Record<string, boolean>;

const BLOCKS = [
  { value: "P", label: "Gövde" },
  { value: "H1", label: "Başlık" },
  { value: "H2", label: "Alt başlık" },
  { value: "H3", label: "Küçük başlık" },
];

const run = (command: string, value?: string) => document.execCommand(command, false, value);

export default function NoteEditor({ note, onChange, onTogglePin, onDelete, allTags, suggestions }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [active, setActive] = useState<Active>({});
  const [block, setBlock] = useState("P");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [words, setWords] = useState(() => wordCount(note.html));
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [announce, setAnnounce] = useState("");

  const currentTags = useMemo(() => note.tags ?? [], [note.tags]);

  const suggestionsList = useMemo(() => {
    const source = allTags || suggestions;
    if (!source) return [];
    if (Array.isArray(source)) {
      return source.map((item) => (typeof item === "string" ? { name: item } : item));
    }
    if (typeof source === "object") {
      return Object.entries(source).map(([name, count]) => ({
        name,
        count: typeof count === "number" ? count : undefined,
      }));
    }
    return [];
  }, [allTags, suggestions]);

  const filteredSuggestions = useMemo(() => {
    return suggestionsList.filter(
      (s) =>
        !currentTags.includes(s.name) &&
        (!tagInput.trim() || s.name.toLowerCase().includes(tagInput.trim().toLowerCase()))
    );
  }, [suggestionsList, currentTags, tagInput]);

  // Not değişince editör içeriğini yükle; yazarken içerik kullanıcıdadır.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.innerHTML = note.html;
    if (titleRef.current) titleRef.current.value = note.title;
    setWords(wordCount(note.html));
    setConfirmDelete(false);
    setTagInput("");
    if (!note.title && !note.html) titleRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [note.title, note.id]);

  const inEditor = () => {
    const sel = window.getSelection();
    return Boolean(sel && sel.anchorNode && bodyRef.current?.contains(sel.anchorNode));
  };

  const refreshState = useCallback(() => {
    if (!inEditor()) return;
    const next: Active = {};
    for (const cmd of ["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"]) {
      try { next[cmd] = document.queryCommandState(cmd); } catch { next[cmd] = false; }
    }
    const anchor = window.getSelection()?.anchorNode;
    const el = anchor && (anchor.nodeType === 1 ? (anchor as Element) : anchor.parentElement);
    next.checklist = Boolean(el?.closest("ul[data-checklist]"));
    next.insertUnorderedList = next.insertUnorderedList && !next.checklist;
    next.quote = Boolean(el?.closest("blockquote"));
    next.code = Boolean(el?.closest("pre"));
    next.link = Boolean(el?.closest("a"));
    setActive(next);
    const tag = el?.closest("h1,h2,h3")?.tagName ?? "P";
    setBlock(tag);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshState);
    return () => document.removeEventListener("selectionchange", refreshState);
  }, [refreshState]);

  const commit = () => {
    const html = sanitizeHtml(bodyRef.current?.innerHTML ?? "");
    setWords(wordCount(html));
    onChange({ html });
  };

  const exec = (command: string, value?: string) => {
    bodyRef.current?.focus();
    run(command, value);
    commit();
    refreshState();
  };

  const toggleChecklist = () => {
    bodyRef.current?.focus();
    const anchor = window.getSelection()?.anchorNode;
    const el = anchor && (anchor.nodeType === 1 ? (anchor as Element) : anchor.parentElement);
    const existing = el?.closest("ul[data-checklist]");
    if (existing) {
      existing.removeAttribute("data-checklist");
      existing.querySelectorAll("li").forEach((li) => li.removeAttribute("data-checked"));
      run("insertUnorderedList");
    } else {
      if (!el?.closest("ul")) run("insertUnorderedList");
      const after = window.getSelection()?.anchorNode;
      const afterEl = after && (after.nodeType === 1 ? (after as Element) : after.parentElement);
      afterEl?.closest("ul")?.setAttribute("data-checklist", "");
    }
    commit();
    refreshState();
  };

  const toggleWrap = (tag: "BLOCKQUOTE" | "PRE") => {
    bodyRef.current?.focus();
    const anchor = window.getSelection()?.anchorNode;
    const el = anchor && (anchor.nodeType === 1 ? (anchor as Element) : anchor.parentElement);
    run("formatBlock", el?.closest(tag.toLowerCase()) ? "P" : tag);
    commit();
    refreshState();
  };

  const addLink = () => {
    bodyRef.current?.focus();
    const sel = window.getSelection();
    const anchor = sel?.anchorNode;
    const el = anchor && (anchor.nodeType === 1 ? (anchor as Element) : anchor.parentElement);
    if (el?.closest("a")) {
      run("unlink");
    } else {
      const url = window.prompt("Bağlantı adresi", "https://");
      if (!url || !/^(https?:\/\/|mailto:)/i.test(url.trim())) return;
      if (sel && sel.isCollapsed) run("insertHTML", `<a href="${url.trim().replace(/"/g, "&quot;")}">${url.trim().replace(/</g, "&lt;")}</a>`);
      else run("createLink", url.trim());
    }
    commit();
    refreshState();
  };

  const onBodyClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName === "LI" && target.parentElement?.hasAttribute("data-checklist")) {
      const rect = target.getBoundingClientRect();
      if (event.clientX - rect.left < 30) {
        event.preventDefault();
        if (target.getAttribute("data-checked") === "true") target.removeAttribute("data-checked");
        else target.setAttribute("data-checked", "true");
        commit();
      }
    }
    const link = target.closest("a");
    if (link && (event.metaKey || event.ctrlKey)) window.open(link.getAttribute("href") ?? "", "_blank", "noopener");
  };

  const onBodyKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      const anchor = window.getSelection()?.anchorNode;
      const el = anchor && (anchor.nodeType === 1 ? (anchor as Element) : anchor.parentElement);
      if (el?.closest("li[data-checked]")) {
        setTimeout(() => {
          const a = window.getSelection()?.anchorNode;
          const cur = a && (a.nodeType === 1 ? (a as Element) : a.parentElement);
          cur?.closest("li")?.removeAttribute("data-checked");
        }, 0);
      }
    }

  };

  const MAX_TAG_LENGTH = 30;

  const handleAddTag = (rawTag: string) => {
    const trimmed = rawTag.trim().replace(/^#+/, "").trim();
    if (!trimmed) {
      setTagError("Lütfen geçerli bir etiket girin.");
      return;
    }
    if (trimmed.length > MAX_TAG_LENGTH) {
      setTagError(`Etiket çok uzun (en fazla ${MAX_TAG_LENGTH} karakter).`);
      return;
    }
    if (/[\s,]/.test(trimmed)) {
      setTagError("Etiket boşluk veya virgül içeremez.");
      return;
    }
    if (currentTags.includes(trimmed)) {
      setTagError("Bu etiket zaten eklenmiş.");
      return;
    }
    setTagError(null);
    setAnnounce(`"${trimmed}" etiketi eklendi`);
    onChange({ tags: [...currentTags, trimmed] });
    setTagInput("");
    setShowSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setAnnounce(`"${tagToRemove}" etiketi kaldırıldı`);
    onChange({ tags: currentTags.filter((t) => t !== tagToRemove) });
    setTagError(null);
  };

  const onPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    if (html) run("insertHTML", sanitizeHtml(html));
    else run("insertText", text);
    commit();
  };

  const tool = (label: string, Icon: typeof Bold, onClick: () => void, pressed = false) => (
    <button type="button" className="tool" aria-label={label} title={label} aria-pressed={pressed}
      onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      <Icon size={17} strokeWidth={2} />
    </button>
  );

  return (
    <section className="editor" aria-label="Not ayrıntısı">
      <div className="editor-toolbar" role="toolbar" aria-label="Biçimlendirme">
        <div className="tool-group">
          {tool("Geri al", Undo2, () => exec("undo"))}
          {tool("Yinele", Redo2, () => exec("redo"))}
        </div>
        <select className="block-select" aria-label="Paragraf biçimi" value={block}
          onChange={(e) => exec("formatBlock", e.target.value)}>
          {BLOCKS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
        <div className="tool-group">
          {tool("Kalın", Bold, () => exec("bold"), active.bold)}
          {tool("İtalik", Italic, () => exec("italic"), active.italic)}
          {tool("Altı çizili", Underline, () => exec("underline"), active.underline)}
          {tool("Üstü çizili", Strikethrough, () => exec("strikeThrough"), active.strikeThrough)}
        </div>
        <div className="tool-group">
          {tool("Madde işaretli liste", List, () => exec("insertUnorderedList"), active.insertUnorderedList)}
          {tool("Numaralı liste", ListOrdered, () => exec("insertOrderedList"), active.insertOrderedList)}
          {tool("Kontrol listesi", ListChecks, toggleChecklist, active.checklist)}
        </div>
        <div className="tool-group">
          {tool("Alıntı", Quote, () => toggleWrap("BLOCKQUOTE"), active.quote)}
          {tool("Kod bloğu", Code, () => toggleWrap("PRE"), active.code)}
          {tool("Bağlantı", Link2, addLink, active.link)}
          {tool("Ayırıcı çizgi", Minus, () => exec("insertHorizontalRule"))}
        </div>
        <div className="tool-spacer" />
        <div className="tool-group">
          {tool(note.pinned ? "Sabitlemeyi kaldır" : "Notu sabitle", note.pinned ? PinOff : Pin, onTogglePin, note.pinned)}
          {tool("Notu sil", Trash2, () => setConfirmDelete((v) => !v), confirmDelete)}
        </div>
      </div>

      <div className="editor-scroll">
        <article className="editor-page">
          {confirmDelete && (
            <div className="delete-confirm-box" role="alert">
              <p className="delete-confirm-text">Bu not çöp kutusuna taşınacak.</p>
              <div className="delete-confirm-actions">
                <button type="button" className="delete-confirm-btn delete-btn-danger" onClick={onDelete}>
                  Sil
                </button>
                <button type="button" className="delete-confirm-btn delete-btn-cancel" onClick={() => setConfirmDelete(false)}>
                  Vazgeç
                </button>
              </div>
            </div>
          )}
          <time className="editor-date" dateTime={new Date(note.updatedAt).toISOString()}>
            {formatFullDate(note.updatedAt)}
          </time>
          <textarea ref={titleRef} className="editor-title" rows={1} aria-label="Not başlığı" placeholder="Başlık"
            defaultValue={note.title}
            onChange={(e) => onChange({ title: e.target.value.replace(/\n/g, " ") })}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); bodyRef.current?.focus(); } }} />
          <div className="editor-tags-container">
            <div className="editor-tags" aria-label="Etiketler">
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                {announce}
              </div>
              {currentTags.map((tag) => (
                <span key={tag} className="tag-chip">
                  <span>#{tag}</span>
                  <button
                    type="button"
                    className="tag-remove"
                    aria-label={`${tag} etiketini kaldır`}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <div className="tag-input-wrapper">
                <input
                  type="text"
                  className="tag-input"
                  aria-label="Etiket ekle"
                  placeholder="Etiket ekle..."
                  value={tagInput}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    if (tagError) setTagError(null);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      if (tagInput.trim()) {
                        handleAddTag(tagInput);
                      }
                    } else if (e.key === "Backspace" && !tagInput && currentTags.length > 0) {
                      handleRemoveTag(currentTags[currentTags.length - 1]);
                    } else if (e.key === "Escape") {
                      setShowSuggestions(false);
                    }
                  }}
                  onBlur={() => {
                    if (tagInput.trim()) {
                      handleAddTag(tagInput);
                    }
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <ul className="tag-suggestions" role="listbox" aria-label="Etiket önerileri">
                    {filteredSuggestions.map((s) => (
                      <li
                        key={s.name}
                        role="option"
                        aria-selected={false}
                        className="tag-suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddTag(s.name);
                        }}
                      >
                        <span>#{s.name}</span>
                        {typeof s.count === "number" && (
                          <span className="tag-count">({s.count})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {tagError && (
              <div className="tag-error" role="alert">
                {tagError}
              </div>
            )}
          </div>
          <div ref={bodyRef} className="editor-body" contentEditable suppressContentEditableWarning role="textbox"
            aria-multiline="true" aria-label="Not içeriği" data-placeholder="Yazmaya başla…"
            onInput={commit} onClick={onBodyClick} onKeyDown={onBodyKeyDown} onPaste={onPaste} />
        </article>
      </div>

      <footer className="editor-status">
        <span>{words} kelime</span>
        <span>Otomatik kaydedilir · Bu tarayıcıda saklanır</span>
      </footer>
    </section>
  );
}

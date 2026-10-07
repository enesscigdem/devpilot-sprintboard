import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, ListChecks, Quote, Code, Link2, Minus,
  Pin, PinOff, Trash2, Undo2, Redo2, X, RotateCcw, History,
} from "lucide-react";
import { formatFullDate, sanitizeHtml, wordCount, type Note } from "@/lib/notes";

type TagSuggestion = { name: string; count?: number } | string;

type Props = {
  note: Note;
  onChange: (patch: { title?: string; html?: string; tags?: string[] }) => void;
  onTogglePin?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
  isTrash?: boolean;
  allTags?: TagSuggestion[] | Record<string, number>;
  suggestions?: TagSuggestion[] | Record<string, number>;
  onToast?: (message: string) => void;
};

type Active = Record<string, boolean>;

const BLOCKS = [
  { value: "P", label: "Gövde" },
  { value: "H1", label: "Başlık" },
  { value: "H2", label: "Alt başlık" },
  { value: "H3", label: "Küçük başlık" },
];

const run = (command: string, value?: string) => document.execCommand(command, false, value);

export default function NoteEditor({
  note,
  onChange,
  onTogglePin = () => {},
  onDelete = () => {},
  onRestore,
  onPermanentDelete,
  isTrash: propIsTrash,
  allTags,
  suggestions,
  onToast,
}: Props) {
  const isTrash = propIsTrash ?? Boolean(note.deletedAt);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [active, setActive] = useState<Active>({});
  const [block, setBlock] = useState("P");
  const [words, setWords] = useState(() => wordCount(note.html));
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [showHistory, setShowHistory] = useState(false);

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
      const msg = "Lütfen geçerli bir etiket girin.";
      setTagError(msg);
      onToast?.(msg);
      return;
    }
    if (trimmed.length > MAX_TAG_LENGTH) {
      const msg = `Etiket çok uzun (en fazla ${MAX_TAG_LENGTH} karakter).`;
      setTagError(msg);
      onToast?.(msg);
      return;
    }
    if (/[\s,]/.test(trimmed)) {
      const msg = "Etiket boşluk veya virgül içeremez.";
      setTagError(msg);
      onToast?.(msg);
      return;
    }
    if (currentTags.includes(trimmed)) {
      const msg = "Bu etiket zaten eklenmiş.";
      setTagError(msg);
      onToast?.(msg);
      return;
    }
    setTagError(null);
    const msg = `"${trimmed}" etiketi eklendi`;
    setAnnounce(msg);
    onToast?.(msg);
    onChange({ tags: [...currentTags, trimmed] });
    setTagInput("");
    setShowSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const msg = `"${tagToRemove}" etiketi kaldırıldı`;
    setAnnounce(msg);
    onToast?.(msg);
    onChange({ tags: currentTags.filter((t) => t !== tagToRemove) });
    setTagError(null);
  };

  const handleRestoreVersion = (version: { title: string; html: string; tags?: string[] }) => {
    if (bodyRef.current) bodyRef.current.innerHTML = version.html;
    if (titleRef.current) titleRef.current.value = version.title;
    setWords(wordCount(version.html));
    onChange({
      title: version.title,
      html: version.html,
      tags: version.tags ?? note.tags,
    });
    setShowHistory(false);
    onToast?.("Önceki sürüm geri yüklendi.");
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
      {isTrash ? (
        <div className="editor-toolbar" role="toolbar" aria-label="Çöp kutusu eylemleri">
          <div className="tool-group">
            <button type="button" className="tool-text-btn" onClick={onRestore} title="Geri Yükle">
              <RotateCcw size={16} />
              <span>Geri Yükle</span>
            </button>
            <button type="button" className="tool-text-btn tool-danger" onClick={onPermanentDelete ?? onDelete} title="Kalıcı Olarak Sil">
              <Trash2 size={16} />
              <span>Kalıcı Olarak Sil</span>
            </button>
          </div>
        </div>
      ) : (
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
            {tool("Düzenleme geçmişi", History, () => setShowHistory((prev) => !prev), showHistory)}
            {tool(note.pinned ? "Sabitlemeyi kaldır" : "Notu sabitle", note.pinned ? PinOff : Pin, onTogglePin, note.pinned)}
            {tool("Notu sil", Trash2, onDelete)}
          </div>
        </div>
      )}

      {showHistory && (
        <div className="editor-history-dialog" style={{ padding: "1rem", borderBottom: "1px solid var(--border, #e5e7eb)", background: "var(--bg-secondary, #f9fafb)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <strong style={{ fontSize: "0.9rem" }}>Düzenleme Geçmişi</strong>
            <button type="button" className="tool" aria-label="Geçmişi kapat" onClick={() => setShowHistory(false)}>
              <X size={16} />
            </button>
          </div>
          {(!note.history || note.history.length === 0) ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted, #6b7280)", margin: 0 }}>
              Bu not için henüz kaydedilmiş bir geçmiş sürüm bulunmuyor.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "180px", overflowY: "auto" }}>
              {note.history.map((item, idx) => (
                <div key={item.id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", borderRadius: "0.375rem", background: "var(--bg, #fff)", border: "1px solid var(--border, #e5e7eb)", fontSize: "0.85rem" }}>
                  <div>
                    <div><strong>{item.title || "Başlıksız"}</strong></div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #6b7280)" }}>
                      {formatFullDate(item.timestamp)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="tool-text-btn"
                    style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                    onClick={() => handleRestoreVersion(item)}
                  >
                    <RotateCcw size={14} />
                    <span>Geri Yükle</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="editor-scroll">
        <article className="editor-page">
          <time className="editor-date" dateTime={new Date(note.updatedAt).toISOString()}>
            {formatFullDate(note.updatedAt)}
          </time>
          <textarea ref={titleRef} className="editor-title" rows={1} aria-label="Not başlığı" placeholder="Başlık"
            defaultValue={note.title}
            readOnly={isTrash}
            onChange={(e) => { if (!isTrash) onChange({ title: e.target.value.replace(/\n/g, " ") }); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !isTrash) { e.preventDefault(); bodyRef.current?.focus(); } }} />
          <div className="editor-tags-container">
            <div className="editor-tags" aria-label="Etiketler">
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                {announce}
              </div>
              {currentTags.map((tag) => (
                <span key={tag} className="tag-chip inline-flex items-center">
                  <span>#{tag}</span>
                  {!isTrash && (
                    <button
                      type="button"
                      className="tag-remove inline-flex items-center justify-center"
                      aria-label={`${tag} etiketini kaldır`}
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
              {!isTrash && (
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
                    if (e.key === "Enter" || e.key === "," || e.key === " ") {
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
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    if (/[\s,]/.test(text.trim())) {
                      e.preventDefault();
                      const parts = text.split(/[\s,]+/).map((p) => p.trim().replace(/^#+/, "")).filter(Boolean);
                      if (parts.length > 0) {
                        const nextTags = [...currentTags];
                        for (const part of parts) {
                          if (part.length <= MAX_TAG_LENGTH && !nextTags.includes(part)) {
                            nextTags.push(part);
                          }
                        }
                        if (nextTags.length > currentTags.length) {
                          onChange({ tags: nextTags });
                          const msg = `${nextTags.length - currentTags.length} etiket eklendi`;
                          setAnnounce(msg);
                          onToast?.(msg);
                        }
                        setTagInput("");
                        setShowSuggestions(false);
                      }
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
              )}
            </div>
            {!isTrash && tagError && (
              <div className="tag-error" role="alert">
                {tagError}
              </div>
            )}
          </div>
          <div ref={bodyRef} className="editor-body" contentEditable={!isTrash} suppressContentEditableWarning role="textbox"
            aria-multiline="true" aria-label="Not içeriği" data-placeholder={isTrash ? "" : "Yazmaya başla…"}
            onInput={isTrash ? undefined : commit} onClick={isTrash ? undefined : onBodyClick} onKeyDown={isTrash ? undefined : onBodyKeyDown} onPaste={isTrash ? undefined : onPaste} />
        </article>
      </div>

      <footer className="editor-status">
        <span>{words} kelime</span>
        <span>Otomatik kaydedilir · Bu tarayıcıda saklanır</span>
      </footer>
    </section>
  );
}

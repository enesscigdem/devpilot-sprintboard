import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, ListChecks, Quote, Code, Link2, Minus,
  Pin, PinOff, Trash2, Undo2, Redo2, X, RotateCcw, LayoutTemplate, History, Clock,
} from "lucide-react";
import { formatFullDate, sanitizeHtml, wordCount, type Note, NOTE_TEMPLATES } from "@/lib/notes";

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

const FONT_SIZES = [
  { value: "small", label: "Küçük Yazı" },
  { value: "standard", label: "Standart Yazı" },
  { value: "large", label: "Büyük Yazı" },
];

const FALLBACK_TEMPLATES = [
  {
    id: "meeting",
    name: "Toplantı Notu",
    description: "Gündem, katılımcılar, kararlar ve aksiyonlar",
    title: "Toplantı Notu",
    html: "<h2>Gündem</h2><ul><li></li></ul><h2>Katılımcılar</h2><ul><li></li></ul><h2>Alınan Kararlar</h2><ul><li></li></ul><h2>Aksiyon Maddeleri</h2><ul data-checklist=\"\"><li></li></ul>",
  },
  {
    id: "daily",
    name: "Günlük Plan",
    description: "Öncelikler, yapılacaklar listesi ve notlar",
    title: "Günlük Plan",
    html: "<h2>Öncelikli Hedefler</h2><ul data-checklist=\"\"><li></li></ul><h2>Yapılacaklar</h2><ul data-checklist=\"\"><li></li></ul><h2>Günün Notları</h2><p></p>",
  },
  {
    id: "checklist",
    name: "Kontrol Listesi",
    description: "Hızlı yapılacaklar ve görev takibi",
    title: "Kontrol Listesi",
    html: "<ul data-checklist=\"\"><li>Madde 1</li><li>Madde 2</li><li>Madde 3</li></ul>",
  },
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
  const [fontSize, setFontSize] = useState<"small" | "standard" | "large">(() => {
    try {
      return (localStorage.getItem("note_font_size") as "small" | "standard" | "large") || "standard";
    } catch {
      return "standard";
    }
  });
  const [words, setWords] = useState(() => wordCount(note.html));
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const historyMenuRef = useRef<HTMLDivElement>(null);

  const templates = NOTE_TEMPLATES && NOTE_TEMPLATES.length > 0 ? NOTE_TEMPLATES : FALLBACK_TEMPLATES;

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

  useEffect(() => {
    if (!showTemplateMenu && !showHistory) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setShowTemplateMenu(false);
      }
      if (historyMenuRef.current && !historyMenuRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTemplateMenu, showHistory]);

  const handleRestoreVersion = (version: { title?: string; html: string; tags?: string[]; timestamp?: number; updatedAt?: number }) => {
    const newTitle = version.title ?? "";
    const newHtml = sanitizeHtml(version.html ?? "");
    const newTags = version.tags ?? currentTags;

    if (bodyRef.current) {
      bodyRef.current.innerHTML = newHtml;
    }
    if (titleRef.current) {
      titleRef.current.value = newTitle;
    }

    setWords(wordCount(newHtml));
    onChange({ title: newTitle, html: newHtml, tags: newTags });
    const versionDate = version.timestamp || version.updatedAt;
    const dateStr = versionDate ? ` (${formatFullDate(versionDate)})` : "";
    onToast?.(`Not önceki sürüme geri yüklendi${dateStr}`);
    setShowHistory(false);
    bodyRef.current?.focus();
  };

  const handleApplyTemplate = (tpl: { title?: string; html: string; name?: string }) => {
    const newTitle = (!note.title.trim() || note.title === "Başlıksız Not") && tpl.title ? tpl.title : (note.title || tpl.title || "");
    const newHtml = sanitizeHtml(tpl.html);

    if (bodyRef.current) {
      bodyRef.current.innerHTML = newHtml;
    }
    if (titleRef.current && newTitle) {
      titleRef.current.value = newTitle;
    }

    setWords(wordCount(newHtml));
    onChange({ title: newTitle, html: newHtml });
    onToast?.(`"${tpl.name || tpl.title || 'Şablon'}" şablonu uygulandı`);
    bodyRef.current?.focus();
  };

  const isEditorEmpty = !isTrash && !note.title.trim() && !note.html.replace(/<[^>]*>/g, "").trim();

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
    const trimmed = rawTag.trim().replace(/^#+/, "").replace(/\s+/g, "-").replace(/,/g, "").trim();
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
        <div className="editor-toolbar overflow-x-auto" role="toolbar" aria-label="Çöp kutusu eylemleri">
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
        <div className="editor-toolbar overflow-x-auto" role="toolbar" aria-label="Biçimlendirme">
          <div className="tool-group">
            {tool("Geri al", Undo2, () => exec("undo"))}
            {tool("Yinele", Redo2, () => exec("redo"))}
          </div>
          <select className="block-select" aria-label="Paragraf biçimi" value={block}
            onChange={(e) => exec("formatBlock", e.target.value)}>
            {BLOCKS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
          <select
            className="block-select font-size-select"
            aria-label="Yazı boyutu"
            value={fontSize}
            onChange={(e) => {
              const val = e.target.value as "small" | "standard" | "large";
              setFontSize(val);
              try {
                localStorage.setItem("note_font_size", val);
              } catch {}
            }}
          >
            {FONT_SIZES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
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
          <div className="tool-group" ref={templateMenuRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="tool"
              aria-label="Hazır Şablonlar"
              title="Hazır Şablonlar"
              aria-expanded={showTemplateMenu}
              onClick={() => setShowTemplateMenu((v) => !v)}
            >
              <LayoutTemplate size={17} strokeWidth={2} />
            </button>
            {showTemplateMenu && (
              <div
                className="template-dropdown"
                role="menu"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "4px",
                  background: "var(--color-bg-elevated, #fff)",
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: "8px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  zIndex: 50,
                  minWidth: "200px",
                  padding: "4px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    className="template-dropdown-item"
                    role="menuitem"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      color: "inherit",
                      width: "100%",
                    }}
                    onClick={() => {
                      handleApplyTemplate(tpl);
                      setShowTemplateMenu(false);
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: "13px" }}>{tpl.name}</span>
                    <span style={{ fontSize: "11px", opacity: 0.7 }}>{tpl.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="tool-group" ref={historyMenuRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="tool"
              aria-label="Sürüm Geçmişi"
              title="Sürüm Geçmişi"
              aria-expanded={showHistory}
              onClick={() => setShowHistory((v) => !v)}
            >
              <History size={17} strokeWidth={2} />
            </button>
            {showHistory && (
              <div
                className="history-dropdown"
                role="menu"
                aria-label="Düzenleme Geçmişi"
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "4px",
                  background: "var(--color-bg-elevated, #fff)",
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: "8px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  zIndex: 50,
                  minWidth: "280px",
                  maxWidth: "340px",
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid var(--color-border, #e5e7eb)", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>Düzenleme Geçmişi</span>
                  <span style={{ fontSize: "11px", opacity: 0.6 }}>{(note as unknown as { history?: unknown[] }).history?.length || 0} kayıt</span>
                </div>
                {(!(note as unknown as { history?: unknown[] }).history || (note as unknown as { history?: unknown[] }).history!.length === 0) ? (
                  <div style={{ padding: "12px 8px", textAlign: "center", fontSize: "12px", opacity: 0.7 }}>
                    Henüz kaydedilmiş önceki bir sürüm bulunmuyor.
                  </div>
                ) : (
                  <div style={{ maxHeight: "260px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {((note as unknown as { history?: Array<{ id?: string; timestamp?: number; updatedAt?: number; title?: string; html: string; tags?: string[] }> }).history || []).map((ver, idx) => {
                      const verTime = ver.timestamp || ver.updatedAt || Date.now();
                      const plainText = ver.html.replace(/<[^>]*>/g, " ").trim().slice(0, 60) || "(Boş içerik)";
                      return (
                        <div
                          key={ver.id || idx}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid var(--color-border, #e5e7eb)",
                            background: "var(--color-bg-subtle, rgba(0,0,0,0.02))",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", opacity: 0.8 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Clock size={12} />
                              {formatFullDate(verTime)}
                            </span>
                          </div>
                          <div style={{ fontSize: "12px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ver.title || "(Başlıksız)"}
                          </div>
                          <div style={{ fontSize: "11px", opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {plainText}
                          </div>
                          <button
                            type="button"
                            style={{
                              marginTop: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              padding: "4px 8px",
                              fontSize: "11px",
                              fontWeight: 500,
                              borderRadius: "4px",
                              border: "1px solid var(--color-border, #e5e7eb)",
                              background: "var(--color-bg, #fff)",
                              cursor: "pointer",
                              color: "inherit",
                            }}
                            onClick={() => handleRestoreVersion(ver)}
                          >
                            <RotateCcw size={12} />
                            <span>Bu Sürüme Dön</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="tool-spacer" />
          <div className="tool-group">
            {tool(note.pinned ? "Sabitlemeyi kaldır" : "Notu sabitle", note.pinned ? PinOff : Pin, onTogglePin, note.pinned)}
            {tool("Notu sil", Trash2, onDelete)}
          </div>
        </div>
      )}

      <div className="editor-scroll">
        <article className="editor-page">
          <time className="editor-date font-medium text-xs text-muted-foreground" dateTime={new Date(note.updatedAt).toISOString()}>
            Son düzenleme: {formatFullDate(note.updatedAt)}
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
                <span key={tag} className="tag-chip inline-flex items-center gap-1">
                  <span>#{tag}</span>
                  {!isTrash && (
                    <button
                      type="button"
                      className="tag-remove ml-1 inline-flex items-center justify-center"
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
          {isEditorEmpty && (
            <div
              className="editor-templates-prompt"
              style={{
                margin: "12px 0 16px 0",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px dashed var(--color-border, #e5e7eb)",
                background: "var(--color-bg-subtle, rgba(0,0,0,0.02))",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px", color: "var(--color-text-muted, #6b7280)" }}>
                Hazır Şablon ile Başla:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    className="template-prompt-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 500,
                      border: "1px solid var(--color-border, #e5e7eb)",
                      background: "var(--color-bg, #ffffff)",
                      cursor: "pointer",
                      color: "inherit",
                    }}
                    onClick={() => handleApplyTemplate(tpl)}
                  >
                    <LayoutTemplate size={14} />
                    <span>{tpl.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={bodyRef} className={`editor-body font-size-${fontSize}`} style={{
            fontSize: fontSize === "small" ? "0.875rem" : fontSize === "large" ? "1.175rem" : "1rem",
          }} contentEditable={!isTrash} suppressContentEditableWarning role="textbox"
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

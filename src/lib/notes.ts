export type Note = {
  id: string;
  title: string;
  /** Temizlenmiş zengin metin (HTML). */
  html: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  /** Çöp kutusuna taşınma zaman damgası veya undefined. */
  deletedAt?: number;
  /** ISO 8601 tarih dizesi (YYYY-MM-DD) veya undefined. */
  dueDate?: string;
  tags: string[];
};

export const NOTES_KEY = "sprintboard.notes.v2";
export const NOTE_SORT_KEY = "sprintboard.notes.sort";
/** Eski görev panosu kayıtları; ilk açılışta notlara dönüştürülür. */
export const LEGACY_TASKS_KEY = "sprintboard.tasks.v1";

export type NoteSortOption = "updatedAt" | "createdAt" | "title";

const ALLOWED_TAGS = new Set([
  "P", "BR", "DIV", "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "H1", "H2", "H3",
  "UL", "OL", "LI", "BLOCKQUOTE", "PRE", "CODE", "A", "HR",
]);

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Editörden veya depodan gelen HTML'i izin verilen etiketlerle sınırlar. */
export function sanitizeHtml(input: string): string {
  if (typeof DOMParser === "undefined") return "";
  const doc = new DOMParser().parseFromString(`<body>${input}</body>`, "text/html");
  const clean = (node: Node, out: Node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        out.appendChild(document.createTextNode(child.textContent ?? ""));
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const el = child as HTMLElement;
      if (!ALLOWED_TAGS.has(el.tagName)) {
        if (!["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED"].includes(el.tagName)) clean(el, out);
        return;
      }
      const copy = document.createElement(el.tagName);
      if (el.tagName === "A") {
        const href = el.getAttribute("href") ?? "";
        if (/^(https?:|mailto:)/i.test(href)) {
          copy.setAttribute("href", href);
          copy.setAttribute("target", "_blank");
          copy.setAttribute("rel", "noopener noreferrer");
        }
      }
      if (el.tagName === "UL" && el.hasAttribute("data-checklist")) copy.setAttribute("data-checklist", "");
      if (el.tagName === "LI" && el.getAttribute("data-checked") === "true") copy.setAttribute("data-checked", "true");
      clean(el, copy);
      out.appendChild(copy);
    });
  };
  const holder = document.createElement("div");
  clean(doc.body, holder);
  return holder.innerHTML;
}

export function htmlToText(html: string): string {
  if (typeof document === "undefined") return "";
  const holder = document.createElement("div");
  holder.innerHTML = html;
  return (holder.textContent ?? "").replace(/\s+/g, " ").trim();
}

export const wordCount = (html: string) => {
  const text = htmlToText(html);
  return text ? text.split(" ").length : 0;
};

export type NoteTemplate = {
  id: string;
  name: string;
  description: string;
  title: string;
  html: string;
};

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "meeting",
    name: "Toplantı Notu",
    description: "Katılımcılar, gündem maddeleri ve aksiyon kararları",
    title: "Toplantı Notu: ",
    html: sanitizeHtml(`
      <h2>📅 Toplantı Detayları</h2>
      <p><strong>Tarih:</strong> </p>
      <p><strong>Katılımcılar:</strong> </p>
      <hr>
      <h2>🎯 Gündem</h2>
      <ul>
        <li>Madde 1</li>
        <li>Madde 2</li>
      </ul>
      <h2>📝 Tartışma & Notlar</h2>
      <p></p>
      <h2>✅ Aksiyon Maddeleri</h2>
      <ul data-checklist>
        <li>Sorumlu: Görev tanımı</li>
      </ul>
    `),
  },
  {
    id: "daily-planner",
    name: "Günlük Plan",
    description: "Öncelikli hedefler, yapılacaklar ve gün sonu değerlendirmesi",
    title: "Günlük Plan - ",
    html: sanitizeHtml(`
      <h2>🌟 Günün Öncelikli Hedefleri</h2>
      <ol>
        <li>1. Öncelikli hedef</li>
        <li>2. Öncelikli hedef</li>
      </ol>
      <hr>
      <h2>📋 Yapılacaklar</h2>
      <ul data-checklist>
        <li>Görev 1</li>
        <li>Görev 2</li>
        <li>Görev 3</li>
      </ul>
      <h2>💡 Gün Sonu Değerlendirmesi & Notlar</h2>
      <p></p>
    `),
  },
  {
    id: "checklist",
    name: "Kontrol Listesi",
    description: "Adım adım takip edilecek görev ve kontrol listesi",
    title: "Kontrol Listesi",
    html: sanitizeHtml(`
      <h2>✅ Kontrol Listesi</h2>
      <ul data-checklist>
        <li>İlk kontrol maddesi</li>
        <li>İkinci kontrol maddesi</li>
        <li>Üçüncü kontrol maddesi</li>
      </ul>
    `),
  },
  {
    id: "project-brief",
    name: "Proje Taslağı",
    description: "Hedefler, kapsam, kilometre taşları ve teslim edilecekler",
    title: "Proje: ",
    html: sanitizeHtml(`
      <h2>🎯 Proje Amacı & Kapsam</h2>
      <p></p>
      <h2>🚩 Kilometre Taşları</h2>
      <ul>
        <li>Aşama 1: </li>
        <li>Aşama 2: </li>
      </ul>
      <h2>📦 Teslim Edilecekler</h2>
      <ul data-checklist>
        <li>Teslimat 1</li>
        <li>Teslimat 2</li>
      </ul>
    `),
  },
];

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `not-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createNote = (now = Date.now()): Note => ({
  id: newId(), title: "", html: "", pinned: false, createdAt: now, updatedAt: now, tags: [],
});

const readJson = (key: string): unknown => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const asList = (value: unknown): unknown[] =>
  Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { tasks?: unknown }).tasks)
      ? (value as { tasks: unknown[] }).tasks
      : [];

const isCheckable = (status: unknown) => status === "Tamamlandı";

function fromStored(entry: unknown, seen: Set<string>): Note | null {
  if (!entry || typeof entry !== "object") return null;
  const r = entry as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : "";
  if (!id || seen.has(id)) return null;
  const title = typeof r.title === "string" ? r.title.trim() : "";
  const html = typeof r.html === "string" ? sanitizeHtml(r.html) : "";
  seen.add(id);
  const num = (v: unknown, fb: number) => (typeof v === "number" && Number.isFinite(v) ? v : fb);
  const now = Date.now();
  const createdAt = num(r.createdAt, now);
  const deletedAt = typeof r.deletedAt === "number" && Number.isFinite(r.deletedAt) ? r.deletedAt : undefined;
  const dueDate = typeof r.dueDate === "string" ? r.dueDate : undefined;
  const tags = Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string") : [];
  return { id, title, html, pinned: r.pinned === true, createdAt, updatedAt: num(r.updatedAt, createdAt), deletedAt, dueDate, tags };
}

/** Eski görev kaydını (başlık, açıklama, durum) zengin bir nota çevirir. */
function fromLegacyTask(entry: unknown, seen: Set<string>, now: number): Note | null {
  if (!entry || typeof entry !== "object") return null;
  const r = entry as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : "";
  const title = typeof r.title === "string" ? r.title.trim() : "";
  if (!id || !title || seen.has(id)) return null;
  seen.add(id);
  const description = typeof r.description === "string" ? r.description.trim() : "";
  const body = description
    ? description.split(/\n{2,}/).map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("")
    : "";
  const status = typeof r.status === "string" ? r.status : "";
  const marker = status
    ? `<ul data-checklist><li${isCheckable(status) ? ' data-checked="true"' : ""}>${escapeHtml(status)}</li></ul>`
    : "";
  const legacyDate = r.dueDate ?? r.due_date ?? r.date;
  const dueDate = typeof legacyDate === "string" ? legacyDate : undefined;
  return { id, title, html: sanitizeHtml(body + marker), pinned: false, createdAt: now, updatedAt: now, dueDate, tags: [] };
}

/** Notları yükler; bozuk kayıtları atlar, 30 günden eski çöp kutusu notlarını temizler, kayıt yoksa eski görevleri taşır. */
export function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  const seen = new Set<string>();
  const stored = readJson(NOTES_KEY);
  const now = Date.now();
  const maxTrashAge = 30 * 86_400_000;

  if (stored !== null) {
    const rawNotes = asList(stored).map((e) => fromStored(e, seen)).filter((n): n is Note => n !== null);
    const validNotes = rawNotes.filter((n) => !n.deletedAt || now - n.deletedAt <= maxTrashAge);
    if (validNotes.length !== rawNotes.length) {
      saveNotes(validNotes);
    }
    return validNotes;
  }
  return asList(readJson(LEGACY_TASKS_KEY))
    .map((e, i) => fromLegacyTask(e, seen, now - i))
    .filter((n): n is Note => n !== null);
}

export function saveNotes(notes: Note[]) {
  try {
    window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    // Kota dolu veya depolama kapalıysa uygulama çalışmaya devam eder.
  }
}

export const getActiveNotes = (notes: Note[]): Note[] => notes.filter((n) => !n.deletedAt);

export const getTrashNotes = (notes: Note[]): Note[] =>
  notes.filter((n) => typeof n.deletedAt === "number").sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));

export const moveToTrash = (notes: Note[], id: string, now = Date.now()): Note[] =>
  notes.map((n) => (n.id === id ? { ...n, deletedAt: now } : n));

export const restoreNote = (notes: Note[], id: string): Note[] =>
  notes.map((n) => (n.id === id ? { ...n, deletedAt: undefined } : n));

export const permanentlyDeleteNote = (notes: Note[], id: string): Note[] =>
  notes.filter((n) => n.id !== id);

export const emptyTrash = (notes: Note[]): Note[] =>
  notes.filter((n) => !n.deletedAt);

export function getNoteTitle(note: { title?: string; html?: string }, fallback = "Başlıksız not"): string {
  const title = (note.title ?? "").trim();
  if (title) return title;
  const body = htmlToText(note.html ?? "");
  if (body) return body;
  return fallback;
}

/** Notları seçilen ölçüte göre sıralar; sabitlenmiş notlar her zaman başta kalır. */
export function sortNotes(notes: Note[], sortBy: NoteSortOption = "updatedAt"): Note[] {
  const pinned = notes.filter((n) => n.pinned);
  const unpinned = notes.filter((n) => !n.pinned);

  const compare = (a: Note, b: Note) => {
    if (sortBy === "createdAt") {
      return b.createdAt - a.createdAt;
    }
    if (sortBy === "title") {
      const titleA = getNoteTitle(a);
      const titleB = getNoteTitle(b);
      return titleA.localeCompare(titleB, "tr-TR", { sensitivity: "base" });
    }
    return b.updatedAt - a.updatedAt;
  };

  return [...pinned.sort(compare), ...unpinned.sort(compare)];
}

export type NoteGroup = { label: string; notes: Note[] };

/** Notları iCloud Notes gibi Sabitlenmiş / Bugün / Önceki 7 gün / Daha eski olarak gruplar. */
export function groupNotes(notes: Note[], now = Date.now()): NoteGroup[] {
  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const day = 86_400_000;
  const buckets: NoteGroup[] = [
    { label: "Sabitlenmiş", notes: sorted.filter((n) => n.pinned) },
    { label: "Bugün", notes: [] },
    { label: "Dün", notes: [] },
    { label: "Önceki 7 gün", notes: [] },
    { label: "Daha eski", notes: [] },
  ];
  for (const n of sorted.filter((x) => !x.pinned)) {
    const i = n.updatedAt >= startOfToday ? 1 : n.updatedAt >= startOfToday - day ? 2 : n.updatedAt >= startOfToday - 7 * day ? 3 : 4;
    buckets[i].notes.push(n);
  }
  return buckets.filter((g) => g.notes.length > 0);
}

export function formatListDate(ts: number, now = Date.now()): string {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const d = new Date(ts);
  if (ts >= startOfToday) return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (ts >= startOfToday - 86_400_000) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export const formatFullDate = (ts: number) =>
  new Date(ts).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Son tarihi "23 Oca" formatında gösterir. */
export function formatDueDate(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  const day = d.getDate();
  const month = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"][d.getMonth()];
  return `${day} ${month}`;
}

/** Verilen son tarihin geçip geçmediğini kontrol eder. */
export function isOverdue(isoDate: string, now = Date.now()): boolean {
  const dueTime = new Date(isoDate + "T23:59:59").getTime();
  return dueTime < now;
}

/** Etiket dizesini temizler; boşlukları tireye çevirir ve özel karakterleri arındırır. */
export function slugifyTag(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Güvenli dosya adı üretir (özel karakterleri ve geçersiz simgeleri temizler). */
export function sanitizeFilename(input: string, fallback = "not"): string {
  const cleaned = input
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

/** HTML içeriğini Markdown formatına dönüştürür. */
export function htmlToMarkdown(html: string): string {
  if (typeof DOMParser === "undefined") return "";
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");

  const convertNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();
    const childText = Array.from(el.childNodes).map(convertNode).join("");

    switch (tag) {
      case "H1":
        return `\n# ${childText.trim()}\n\n`;
      case "H2":
        return `\n## ${childText.trim()}\n\n`;
      case "H3":
        return `\n### ${childText.trim()}\n\n`;
      case "P":
      case "DIV":
        return childText.trim() ? `${childText.trim()}\n\n` : "\n";
      case "BR":
        return "\n";
      case "STRONG":
      case "B":
        return childText ? `**${childText}**` : "";
      case "EM":
      case "I":
        return childText ? `*${childText}*` : "";
      case "S":
      case "STRIKE":
        return childText ? `~~${childText}~~` : "";
      case "CODE":
        return el.parentElement?.tagName.toUpperCase() === "PRE" ? childText : `\`${childText}\``;
      case "PRE":
        return `\n\`\`\`\n${childText.trim()}\n\`\`\`\n\n`;
      case "BLOCKQUOTE":
        return `\n> ${childText.trim().replace(/\n/g, "\n> ")}\n\n`;
      case "UL": {
        const isChecklist = el.hasAttribute("data-checklist");
        const items = Array.from(el.children)
          .filter((c) => c.tagName.toUpperCase() === "LI")
          .map((li) => {
            const checked = li.getAttribute("data-checked") === "true";
            const inner = Array.from(li.childNodes).map(convertNode).join("").trim();
            return isChecklist ? `- [${checked ? "x" : " "}] ${inner}` : `- ${inner}`;
          })
          .join("\n");
        return items ? `\n${items}\n\n` : "";
      }
      case "OL": {
        const items = Array.from(el.children)
          .filter((c) => c.tagName.toUpperCase() === "LI")
          .map((li, idx) => {
            const inner = Array.from(li.childNodes).map(convertNode).join("").trim();
            return `${idx + 1}. ${inner}`;
          })
          .join("\n");
        return items ? `\n${items}\n\n` : "";
      }
      case "LI":
        return childText;
      case "A": {
        const href = el.getAttribute("href") ?? "";
        return href ? `[${childText || href}](${href})` : childText;
      }
      case "HR":
        return "\n---\n\n";
      default:
        return childText;
    }
  };

  const md = convertNode(doc.body);
  return md.replace(/\n{3,}/g, "\n\n").trim();
}

/** Seçili notu Markdown dizesine dönüştürür. */
export function noteToMarkdown(note: Note): string {
  const parts: string[] = [];
  if (note.title.trim()) {
    parts.push(`# ${note.title.trim()}`);
  }
  const meta: string[] = [];
  if (note.dueDate) {
    meta.push(`**Son Tarih:** ${note.dueDate}`);
  }
  if (note.tags && note.tags.length > 0) {
    meta.push(`**Etiketler:** ${note.tags.map((t) => `#${t}`).join(" ")}`);
  }
  if (meta.length > 0) {
    parts.push(meta.join(" | "));
  }
  const body = htmlToMarkdown(note.html);
  if (body) {
    parts.push(body);
  }
  return parts.join("\n\n");
}

/** Notları JSON dizesine dönüştürür. */
export function notesToJson(notes: Note[]): string {
  return JSON.stringify(notes, null, 2);
}

export type ImportNotesResult = {
  importedCount: number;
  skippedCount: number;
  notes: Note[];
};

/** JSON dizesini doğrular, ayrıştırır ve mevcut notlarla kimlik çakışmalarını atlayarak birleştirir. */
export function importNotesFromJson(
  jsonText: string,
  currentNotes: Note[]
): ImportNotesResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Geçersiz JSON dosyası. Lütfen geçerli bir JSON dosyası seçin.");
  }

  let items: unknown[];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).notes)) {
    items = (parsed as Record<string, unknown>).notes as unknown[];
  } else {
    throw new Error("Dosya uyumsuz veya geçerli bir not yapısı içermiyor.");
  }

  const existingIds = new Set(currentNotes.map((n) => n.id));
  const seenImportIds = new Set<string>();
  const importedNotes: Note[] = [];
  let skippedCount = 0;

  for (const item of items) {
    if (!item || typeof item !== "object") {
      skippedCount++;
      continue;
    }
    const r = item as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    if (!id) {
      skippedCount++;
      continue;
    }
    if (existingIds.has(id) || seenImportIds.has(id)) {
      skippedCount++;
      continue;
    }

    const title = typeof r.title === "string" ? r.title.trim() : "";
    const html = typeof r.html === "string" ? sanitizeHtml(r.html) : "";
    if (!title && !html) {
      skippedCount++;
      continue;
    }

    seenImportIds.add(id);
    const num = (v: unknown, fb: number) => (typeof v === "number" && Number.isFinite(v) ? v : fb);
    const now = Date.now();
    const createdAt = num(r.createdAt, now);
    const updatedAt = num(r.updatedAt, createdAt);
    const deletedAt = typeof r.deletedAt === "number" && Number.isFinite(r.deletedAt) ? r.deletedAt : undefined;
    const dueDate = typeof r.dueDate === "string" && r.dueDate.trim() ? r.dueDate.trim() : undefined;
    const tags = Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0) : [];

    importedNotes.push({
      id,
      title,
      html,
      pinned: r.pinned === true,
      createdAt,
      updatedAt,
      deletedAt,
      dueDate,
      tags,
    });
  }

  return {
    importedCount: importedNotes.length,
    skippedCount,
    notes: [...importedNotes, ...currentNotes],
  };
}

export type ParsedSearchQuery = {
  raw: string;
  generalTerms: string[];
  tags: string[];
  titleTerms: string[];
  contentTerms: string[];
  highlightTerms: string[];
};

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Arama çubuğu dizesini etiket (#), başlık (title:), içerik (content:) ve genel terimlere ayrıştırır. */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const trimmed = query.trim();
  if (!trimmed) {
    return { raw: "", generalTerms: [], tags: [], titleTerms: [], contentTerms: [], highlightTerms: [] };
  }

  const tokens = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  const generalTerms: string[] = [];
  const tags: string[] = [];
  const titleTerms: string[] = [];
  const contentTerms: string[] = [];
  const highlightTerms: string[] = [];

  for (const rawToken of tokens) {
    const token = rawToken.replace(/^"|"$/g, "").trim();
    if (!token) continue;

    if (token.startsWith("#") && token.length > 1) {
      const tag = token.slice(1).toLowerCase();
      tags.push(tag);
      highlightTerms.push(token.slice(1));
    } else if (/^(?:tag|etiket):/i.test(token)) {
      const tag = token.replace(/^(?:tag|etiket):/i, "").trim().toLowerCase();
      if (tag) {
        tags.push(tag);
        highlightTerms.push(tag);
      }
    } else if (/^(?:title|başlık|baslik):/i.test(token)) {
      const val = token.replace(/^(?:title|başlık|baslik):/i, "").trim();
      if (val) {
        titleTerms.push(val.toLowerCase());
        highlightTerms.push(val);
      }
    } else if (/^(?:content|içerik|icerik):/i.test(token)) {
      const val = token.replace(/^(?:content|içerik|icerik):/i, "").trim();
      if (val) {
        contentTerms.push(val.toLowerCase());
        highlightTerms.push(val);
      }
    } else {
      generalTerms.push(token.toLowerCase());
      highlightTerms.push(token);
    }
  }

  return {
    raw: trimmed,
    generalTerms,
    tags,
    titleTerms,
    contentTerms,
    highlightTerms,
  };
}

/** Verilen notun ayrıştırılmış arama sorgusu ile eşleşip eşleşmediğini kontrol eder. */
export function matchNote(note: Note, query: string | ParsedSearchQuery): boolean {
  const parsed = typeof query === "string" ? parseSearchQuery(query) : query;
  if (!parsed.raw && parsed.generalTerms.length === 0 && parsed.tags.length === 0 && parsed.titleTerms.length === 0 && parsed.contentTerms.length === 0) {
    return true;
  }

  const titleLower = (note.title || "").toLowerCase();
  const bodyText = htmlToText(note.html || "").toLowerCase();
  const noteTagsLower = (note.tags || []).map((t) => t.toLowerCase());

  for (const tag of parsed.tags) {
    const hasTag = noteTagsLower.some((t) => t.includes(tag));
    if (!hasTag) return false;
  }

  for (const term of parsed.titleTerms) {
    if (!titleLower.includes(term)) return false;
  }

  for (const term of parsed.contentTerms) {
    if (!bodyText.includes(term)) return false;
  }

  for (const term of parsed.generalTerms) {
    const matchesTitle = titleLower.includes(term);
    const matchesBody = bodyText.includes(term);
    const matchesTag = noteTagsLower.some((t) => t.includes(term));
    if (!matchesTitle && !matchesBody && !matchesTag) {
      return false;
    }
  }

  return true;
}

/** Notları ayrıştırılmış sorguya göre filtreler. */
export function filterNotes(notes: Note[], query: string | ParsedSearchQuery): Note[] {
  const parsed = typeof query === "string" ? parseSearchQuery(query) : query;
  if (!parsed.raw && parsed.generalTerms.length === 0 && parsed.tags.length === 0 && parsed.titleTerms.length === 0 && parsed.contentTerms.length === 0) {
    return notes;
  }
  return notes.filter((note) => matchNote(note, parsed));
}

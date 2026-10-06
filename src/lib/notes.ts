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
/** Eski görev panosu kayıtları; ilk açılışta notlara dönüştürülür. */
export const LEGACY_TASKS_KEY = "sprintboard.tasks.v1";

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
  if (!title && !html) return null;
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

/** Notları yükler; bozuk kayıtları atlar, kayıt yoksa eski görevleri taşır. */
export function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  const seen = new Set<string>();
  const stored = readJson(NOTES_KEY);
  if (stored !== null) {
    return asList(stored).map((e) => fromStored(e, seen)).filter((n): n is Note => n !== null);
  }
  const now = Date.now();
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

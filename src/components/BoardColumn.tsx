export type BoardColumnProps = {
  /** Sütun başlığı (örn. "Yapılacak") */
  title: string
  /** Sütun içindeki kartlar */
  items?: string[]
}

export default function BoardColumn({ title, items = [] }: BoardColumnProps) {
  return (
    <section className="flex flex-col rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-200/50 overflow-hidden" aria-label={title}>
      <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
        <span className="h-2.5 w-2.5 rounded-full bg-blue-500/90 shadow-sm shadow-blue-500/20 ring-4 ring-blue-50" aria-hidden="true" />
        <h2 className="text-[13px] font-semibold tracking-tight text-slate-900 antialiased">{title}</h2>
        <span className="ml-auto inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border border-slate-200 bg-white px-2 text-xs font-medium tabular-nums text-slate-600 shadow-sm">{items.length}</span>
      </header>

      {items.length === 0 ? (
        <div className="m-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></svg></span><p className="text-sm font-medium text-slate-500">Bu sütunda henüz kart yok.</p><p className="text-xs text-slate-400">Yeni görev eklemek için üstteki eylemleri kullanın.</p></div>
      ) : (
        <ul className="flex flex-col gap-3 p-4">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="rounded-xl border border-slate-200/70 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm shadow-slate-200/30 transition-colors hover:border-slate-300 hover:shadow">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

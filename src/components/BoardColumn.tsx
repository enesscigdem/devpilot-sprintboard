export type BoardColumnProps = {
  /** Sütun başlığı (örn. "Yapılacak") */
  title: string
  /** Sütun içindeki kartlar */
  items?: string[]
}

export default function BoardColumn({ title, items = [] }: BoardColumnProps) {
  return (
    <section className="board-column" aria-label={title}>
      <header className="board-column__header">
        <span className="board-column__dot" aria-hidden="true" />
        <h2 className="board-column__title">{title}</h2>
        <span className="board-column__count">{items.length}</span>
      </header>

      {items.length === 0 ? (
        <p className="board-column__empty"><span className="board-column__empty-icon" aria-hidden="true" />Bu sütunda henüz kart yok.</p>
      ) : (
        <ul className="board-column__list">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="board-column__card">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

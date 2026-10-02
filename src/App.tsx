import "./index.css";

type BoardColumnProps = {
  title: string;
};

function BoardColumn({ title }: BoardColumnProps) {
  return (
    <section className="board-column" aria-label={title}>
      <h2 className="board-column-title">{title}</h2>
      <div className="board-column-list" />
    </section>
  );
}

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>SprintBoard</h1>
      </header>
      <main className="board">
        <BoardColumn title="Yapılacak" />
        <BoardColumn title="Devam Ediyor" />
        <BoardColumn title="Tamamlandı" />
      </main>
    </div>
  );
}

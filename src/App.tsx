import "./index.css";
import BoardColumn from "./components/BoardColumn";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>SprintBoard</h1>
        <p className="app-subtitle">Sprintlerinizi planlayın, önceliklendirin ve ilerlemeyi takip edin.</p>
      </header>
      <main className="board">
        <BoardColumn title="Yapılacak" />
        <BoardColumn title="Devam Ediyor" />
        <BoardColumn title="Tamamlandı" />
      </main>
    </div>
  );
}

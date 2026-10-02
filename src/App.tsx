import "./index.css";
import BoardColumn from "./components/BoardColumn";

export default function App() {
  return (
    <div className="min-h-screen bg-[#f8f9fb] font-sans antialiased selection:bg-blue-100">
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-5 md:px-8">
          <div className="flex items-center gap-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M8 9h8M8 12h8M8 15h5" /></svg>
            </span>
            <div>
              <h1 className="text-[17px] font-semibold tracking-tight text-slate-900">SprintBoard</h1>
              <p className="hidden text-xs leading-none text-slate-500 sm:block">Sprintlerinizi planlayın, önceliklendirin ve ilerlemeyi takip edin.</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 sm:hidden">Sprint yönetimi</p>
        </div>
      </header>
      <div className="mx-auto max-w-[1280px] px-6 py-8 md:px-8 md:py-10">
        <div className="mb-8 flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Panonuz</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-500 sm:hidden">Sprintlerinizi planlayın, önceliklendirin ve ilerlemeyi takip edin.</p>
          <p className="hidden max-w-2xl text-sm leading-6 text-slate-500 sm:block">Görevlerinizi üç aşamada takip edin — sade, odaklı ve her cihazda tutarlı.</p>
        </div>
        <main className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-start">
          <BoardColumn title="Yapılacak" />
          <BoardColumn title="Devam Ediyor" />
          <BoardColumn title="Tamamlandı" />
        </main>
      </div>
    </div>
  );
}

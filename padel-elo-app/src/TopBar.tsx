import { Link } from "react-router-dom";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="container-page flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">P</span>
          <span className="font-semibold tracking-tight">Padelholdet</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-2">
          <Link to="/" className="btn-ghost rounded-xl px-3 py-2">Rangliste</Link>
          <Link to="/matches/new" className="btn-ghost rounded-xl px-3 py-2">Ny kamp</Link>
          <Link to="/fines" className="btn-ghost rounded-xl px-3 py-2">Bøder</Link>
          <Link to="/admin" className="btn-ghost rounded-xl px-3 py-2">Admin</Link>
        </nav>
      </div>
    </header>
  );
}

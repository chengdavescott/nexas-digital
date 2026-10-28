import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, LifeBuoy, SearchX } from "lucide-react";
import { Logo } from "../components/ui";

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020618] px-4 py-12 text-slate-200 sm:px-6">
      <div className="pointer-events-none absolute -left-32 top-[-10rem] h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-8rem] h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

      <section className="relative w-full max-w-2xl text-center">
        <Link to="/" className="inline-flex items-center" aria-label="Nexasdigital Bank home">
          <Logo />
        </Link>

        <div className="glass mt-10 rounded-[2rem] px-6 py-10 shadow-2xl shadow-black/30 sm:px-12 sm:py-14">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-300">
            <SearchX className="size-8" aria-hidden="true" />
          </div>
          <p className="mt-7 text-sm font-bold uppercase tracking-[0.24em] text-sky-400">Page not found</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">This page took a wrong turn.</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
            The link may be outdated, or the page may have moved. You can return to the secure home page or go back to where you were.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Go back
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110"
            >
              <Home className="size-4" aria-hidden="true" /> Return home
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
            <LifeBuoy className="size-4" aria-hidden="true" />
            <span>Need help? Our support team is available 24/7.</span>
          </div>
          <p className="mt-3 truncate text-[11px] text-slate-600" title={location.pathname}>
            Requested path: {location.pathname}
          </p>
        </div>
      </section>
    </main>
  );
}

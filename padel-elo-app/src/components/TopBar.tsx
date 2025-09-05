import { NavLink, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function TopBar() {
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      if (user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        setIsAdmin(!!p?.is_admin);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 nav-glass">
      <div className="container-page flex h-16 items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-500"></div>
          <span className="font-semibold text-lg">Padelholdet</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link ${isActive ? "nav-link-active" : ""}`
            }
            end
          >
            Rangliste
          </NavLink>
          <NavLink
            to="/matches/new"
            className={({ isActive }) =>
              `nav-link ${isActive ? "nav-link-active" : ""}`
            }
          >
            Ny kamp
          </NavLink>
          <NavLink
            to="/fines"
            className={({ isActive }) =>
              `nav-link ${isActive ? "nav-link-active" : ""}`
            }
          >
            Bøder
          </NavLink>
          <NavLink
            to="/mine"
            className={({ isActive }) =>
              `nav-link ${isActive ? "nav-link-active" : ""}`
            }
          >
            Mine
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-link ${isActive ? "nav-link-active" : ""}`
              }
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {email ? (
            <>
              <span className="hidden sm:block text-sm text-slate-600">
                {email}
              </span>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
              >
                <button className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800">
                  Log ud
                </button>
              </form>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-brand-500 text-white px-4 py-2 text-sm hover:bg-brand-600"
            >
              Log ind
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

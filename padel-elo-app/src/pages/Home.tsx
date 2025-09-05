import Hero from "../components/Hero";
import Leaderboard from "../components/Leaderboard";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        setIsAdmin(!!p?.is_admin);
      }
    })();
  }, []);

  return (
    <>
      <Hero />
      <Leaderboard />

      <div className="container-page mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/matches/new"
          className="rounded-xl bg-slate-900 text-white px-5 py-4 text-center hover:bg-slate-800 shadow-soft"
        >
          Opret ny kamp
        </Link>
        <Link
          to="/fines"
          className="rounded-xl bg-white px-5 py-4 text-center hover:bg-slate-50 border border-slate-100 shadow-soft"
        >
          Se/tilføj bøder
        </Link>
        <Link
          to="/mine"
          className="rounded-xl bg-white px-5 py-4 text-center hover:bg-slate-50 border border-slate-100 shadow-soft"
        >
          Mine kampe
        </Link>
        {isAdmin && (
          <Link
            to="/admin"
            className="rounded-xl bg-white px-5 py-4 text-center hover:bg-slate-50 border border-slate-100 shadow-soft sm:col-span-3"
          >
            Adminpanel
          </Link>
        )}
      </div>
    </>
  );
}

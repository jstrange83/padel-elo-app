import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Row = {
  player_id: string;
  rating: number;
  profiles?: { full_name: string | null } | null;
};

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    (async () => {
      // forsøger at joine til profiles – hvis FK er sat (typisk er den det)
      const { data, error } = await supabase
        .from("elo_ratings")
        .select("player_id, rating, profiles(full_name)")
        .order("rating", { ascending: false });
      if (!error && data) {
        setRows(data);
      }
    })();
  }, []);

  return (
    <div className="container-page -mt-16 relative">
      {/* kort med shadow på leaderboard */}
      <div className="rounded-2xl bg-white p-5 md:p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rangliste</h2>
        </div>

        <ul className="mt-4 divide-y divide-slate-100">
          {rows.map((r, i) => (
            <li
              key={r.player_id}
              className="flex items-center gap-4 py-3 md:py-4"
            >
              <div className="w-8 text-slate-500 font-semibold">
                {i + 1}.
              </div>
              <div className="flex-1 flex items-center gap-3">
                {/* medalje/indikator til top 3 */}
                {i < 3 ? (
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      i === 0
                        ? "bg-yellow-500"
                        : i === 1
                        ? "bg-slate-400"
                        : "bg-orange-500"
                    }`}
                  />
                ) : (
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-200" />
                )}
                <span className="text-slate-900">
                  {r.profiles?.full_name || r.player_id}
                </span>
              </div>
              <div className="font-semibold tabular-nums">
                {r.rating.toFixed(1)}
              </div>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="py-6 text-slate-500 text-sm">Ingen spillere endnu.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

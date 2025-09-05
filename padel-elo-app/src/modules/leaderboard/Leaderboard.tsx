import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Row = { rating: number; player_id: string; players: { nickname: string } | null }

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    supabase
      .from('elo_ratings')
      .select('rating, player_id, players(nickname)')
      .order('rating', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        setRows(data || [])
      })
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Rangliste</h1>
      <ul className="grid gap-3 md:grid-cols-2">
        {rows.map((r, i) => (
          <li key={r.player_id} className="card p-4 flex justify-between items-center">
            <span>{i + 1}. {r.players?.nickname ?? 'Ukendt'}</span>
            <span className="font-mono text-lg">{r.rating}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

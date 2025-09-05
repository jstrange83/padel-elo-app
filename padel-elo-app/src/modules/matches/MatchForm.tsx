import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Player } from '../../types'

export default function MatchForm() {
  const [players, setPlayers] = useState<Player[]>([])
  const [teamA1, setTeamA1] = useState('')
  const [teamA2, setTeamA2] = useState('')
  const [teamB1, setTeamB1] = useState('')
  const [teamB2, setTeamB2] = useState('')
  const [score, setScore] = useState('6-4, 6-4')
  const [winner, setWinner] = useState<'A'|'B'>('A')
  const [playedAt, setPlayedAt] = useState<string>(() => new Date().toISOString().slice(0,10))

  useEffect(() => {
    supabase.from('players').select('id, nickname').then(({ data }) => setPlayers((data||[]) as Player[]))
  }, [])

  async function submit() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return alert('Login kræves')
    const user = session.user
    const res = await fetch('/.netlify/functions/record-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        played_at: playedAt,
        score, winner,
        created_by: user.id,
        teamA: { p1: teamA1 || null, p2: teamA2 || null },
        teamB: { p1: teamB1 || null, p2: teamB2 || null }
      })
    })
    if (!res.ok) return alert('Fejl ved oprettelse af kamp')
    alert('Kamp registreret! Elo opdateret.')
    setScore('6-4, 6-4')
  }

  function PlayerSelect({ value, onChange }:{ value: string; onChange: (v:string)=>void }) {
    return (
      <select className="select" value={value} onChange={e=>onChange(e.target.value)}>
        <option value="">Vælg spiller</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
      </select>
    )
  }

  return (
    <div className="max-w-2xl mx-auto card p-4 space-y-3">
      <h1 className="text-xl font-bold">Registrér kamp</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="font-semibold mb-2">Hold A</div>
          <PlayerSelect value={teamA1} onChange={setTeamA1} />
          <div className="h-2" />
          <PlayerSelect value={teamA2} onChange={setTeamA2} />
        </div>
        <div>
          <div className="font-semibold mb-2">Hold B</div>
          <PlayerSelect value={teamB1} onChange={setTeamB1} />
          <div className="h-2" />
          <PlayerSelect value={teamB2} onChange={setTeamB2} />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="grid gap-1">
          <label className="text-sm text-muted">Dato</label>
          <input className="input" type="date" value={playedAt} onChange={e=>setPlayedAt(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-muted">Vinder</label>
          <select className="select" value={winner} onChange={e=>setWinner(e.target.value as 'A'|'B')}>
            <option value="A">Hold A</option>
            <option value="B">Hold B</option>
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-muted">Score</label>
          <input className="input" value={score} onChange={e=>setScore(e.target.value)} />
        </div>
      </div>
      <button className="btn" onClick={submit}>Gem kamp</button>
    </div>
  )
}

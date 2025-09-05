import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { FineType, Fine, Player } from '../../types'

export default function FinePage() {
  const [types, setTypes] = useState<FineType[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedType, setSelectedType] = useState('')
  const [target, setTarget] = useState('')
  const [comment, setComment] = useState('')
  const [myFines, setMyFines] = useState<Fine[]>([])

  useEffect(() => {
    supabase.from('fine_types').select('*').then(({ data }) => setTypes((data||[]) as FineType[]))
    supabase.from('players').select('id, nickname').then(({ data }) => setPlayers((data||[]) as Player[]))
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from('fines')
          .select('*')
          .eq('issuer_id', user.id)
          .order('created_at', { ascending: false })
        setMyFines((data||[]) as Fine[])
      }
    })
  }, [])

  async function submitFine() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return alert('Login kræves')
    const ft = types.find(t => t.id === selectedType)
    if (!ft || !target) return alert('Vælg type og spiller')
    const { error } = await supabase.from('fines').insert({
      fine_type_id: ft.id,
      issuer_id: user.id,
      target_player_id: target,
      comment,
      amount_cents: ft.amount_cents,
      status: 'pending'
    })
    if (error) return alert(error.message)
    alert('Bøde indsendt – afventer godkendelse')
    setComment(''); setSelectedType(''); setTarget('')
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-4 space-y-3">
        <h2 className="font-bold text-lg">Indstil bøde</h2>
        <select className="select" value={selectedType} onChange={e=>setSelectedType(e.target.value)}>
          <option value="">Vælg bøde-type</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.title} ({(t.amount_cents/100).toFixed(2)} kr)</option>)}
        </select>
        <select className="select" value={target} onChange={e=>setTarget(e.target.value)}>
          <option value="">Vælg spiller</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
        </select>
        <textarea className="input" placeholder="Kommentar (valgfri)" value={comment} onChange={e=>setComment(e.target.value)} />
        <button className="btn" onClick={submitFine}>Indstil bøde</button>
      </div>

      <div className="space-y-3">
        <h2 className="font-bold text-lg">Dine bøder</h2>
        {(myFines||[]).map(f => (
          <div key={f.id} className="card p-3 flex justify-between">
            <div>
              <div className="font-semibold">{f.comment || 'Bøde'}</div>
              <div className="text-sm text-muted">{(f.amount_cents/100).toFixed(2)} kr</div>
            </div>
            <div className="text-sm">{f.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

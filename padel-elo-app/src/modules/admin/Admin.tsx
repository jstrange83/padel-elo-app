import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Fine, FineType } from '../../types'

export default function Admin() {
  const [pending, setPending] = useState<Fine[]>([])
  const [types, setTypes] = useState<FineType[]>([])
  const [newType, setNewType] = useState({ title: '', amount: 20 })

  async function fetchAll() {
    const { data: p } = await supabase.from('fines').select('*').eq('status','pending').order('created_at', { ascending: false })
    setPending((p||[]) as Fine[])
    const { data: t } = await supabase.from('fine_types').select('*').order('created_at', { ascending: false })
    setTypes((t||[]) as FineType[])
  }

  useEffect(() => {
    fetchAll()
  }, [])

  async function approve(fineId: string, approve: boolean) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return alert('Login kræves')
    const res = await fetch('/.netlify/functions/approve-fine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ fineId, approve, adminUserId: session.user.id })
    })
    if (!res.ok) return alert('Fejl (mangler admin?)')
    await fetchAll()
  }

  async function addType() {
    const { error } = await supabase.from('fine_types').insert({
      title: newType.title, amount_cents: Math.round(newType.amount*100), active: true
    })
    if (error) return alert(error.message)
    setNewType({ title: '', amount: 20 })
    await fetchAll()
  }

  async function toggleType(t: FineType) {
    const { error } = await supabase.from('fine_types').update({ active: !t.active }).eq('id', t.id)
    if (error) return alert(error.message)
    await fetchAll()
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h2 className="font-bold text-lg">Ventende bøder</h2>
        {pending.map(f => (
          <div key={f.id} className="card p-3 flex justify-between items-center">
            <div>
              <div className="font-semibold">{f.comment || 'Bøde'}</div>
              <div className="text-sm text-muted">{(f.amount_cents/100).toFixed(2)} kr</div>
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={()=>approve(f.id, true)}>Godkend</button>
              <button className="btn" onClick={()=>approve(f.id, false)}>Afvis</button>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <h2 className="font-bold text-lg">Bøde-typer</h2>
        <div className="card p-3 space-y-2">
          <input className="input" placeholder="Titel" value={newType.title} onChange={e=>setNewType({...newType, title: e.target.value})} />
          <input className="input" type="number" placeholder="Beløb (kr)" value={newType.amount} onChange={e=>setNewType({...newType, amount: Number(e.target.value)})} />
          <button className="btn" onClick={addType}>Tilføj type</button>
        </div>
        <div className="space-y-2">
          {types.map(t => (
            <div key={t.id} className="card p-3 flex justify-between items-center">
              <div><div className="font-semibold">{t.title}</div><div className="text-sm text-muted">{(t.amount_cents/100).toFixed(2)} kr</div></div>
              <button className="btn" onClick={()=>toggleType(t)}>{t.active ? 'Deaktivér' : 'Aktivér'}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

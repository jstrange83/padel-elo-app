import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [nickname, setNickname] = useState('')
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (mode === 'signup') {
        const { data: { user }, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!user) throw new Error('Signup fejlede')
        await supabase.from('profiles').upsert({ id: user.id, full_name: email })
        if (nickname) {
          const { data: player } = await supabase.from('players').insert({ user_id: user.id, nickname }).select().single()
          // elo_ratings oprettes af DB trigger
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      navigate('/')
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div className="max-w-md mx-auto card p-6 space-y-4">
      <h1 className="text-xl font-bold">{mode === 'signup' ? 'Opret bruger' : 'Log ind'}</h1>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-1">
          <label className="text-sm text-muted">Email</label>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} required type="email" />
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-muted">Password</label>
          <input className="input" value={password} onChange={e=>setPassword(e.target.value)} required type="password" />
        </div>
        {mode === 'signup' && (
          <div className="grid gap-1">
            <label className="text-sm text-muted">Nickname (vises på ranglisten)</label>
            <input className="input" value={nickname} onChange={e=>setNickname(e.target.value)} />
          </div>
        )}
        <button className="btn">{mode === 'signup' ? 'Opret' : 'Log ind'}</button>
      </form>
      <button className="text-sm underline" onClick={()=>setMode(mode==='signup'?'login':'signup')}>
        {mode === 'signup' ? 'Har du en konto? Log ind' : 'Ny bruger? Opret konto'}
      </button>
    </div>
  )
}

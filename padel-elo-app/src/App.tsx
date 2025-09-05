import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useEffect, useState } from 'react'

export default function App() {
  const [email, setEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email ?? null)
      if (user) {
        await supabase.from('profiles').upsert({ id: user.id, full_name: user.email })
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        setIsAdmin(!!profile?.is_admin)
      }
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div>
      <nav className="bg-white border-b">
        <div className="container-page flex items-center gap-4">
          <Link to="/" className="font-bold text-lg py-3">Padel Rangliste</Link>
          <NavLink to="/" className="text-sm text-slate-600">Rangliste</NavLink>
          <NavLink to="/matches/new" className="text-sm text-slate-600">Ny kamp</NavLink>
          <NavLink to="/fines" className="text-sm text-slate-600">Bøder</NavLink>
          {isAdmin && <NavLink to="/admin" className="text-sm text-slate-600">Admin</NavLink>}
          <div className="ml-auto flex items-center gap-2">
            {email ? (
              <>
                <span className="text-sm text-slate-600">Logget ind som {email}</span>
                <button className="btn" onClick={logout}>Log ud</button>
              </>
            ) : (
              <NavLink to="/login" className="btn">Log ind</NavLink>
            )}
          </div>
        </div>
      </nav>
      <main className="container-page my-6">
        <Outlet />
      </main>
    </div>
  )
}

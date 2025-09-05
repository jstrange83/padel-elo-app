import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE)

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
    const auth = event.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.substring(7) : null
    if (!token) return { statusCode: 401, body: 'Missing auth token' }
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return { statusCode: 401, body: 'Invalid token' }

    const { fineId, approve, adminUserId } = JSON.parse(event.body || '{}')
    if (!fineId || !adminUserId) return { statusCode: 400, body: 'fineId and adminUserId required' }
    if (adminUserId !== user.id) return { statusCode: 403, body: 'Mismatch user' }

    const { data: admin, error: adminErr } = await supabase
      .from('profiles').select('is_admin').eq('id', adminUserId).single()
    if (adminErr || !admin?.is_admin) return { statusCode: 403, body: 'Not admin' }

    if (!approve) {
      await supabase.from('fines').update({ status: 'rejected', decided_by: adminUserId, decided_at: new Date().toISOString() }).eq('id', fineId)
      return { statusCode: 200, body: 'rejected' }
    }

    const { data: fine } = await supabase.from('fines').select('*').eq('id', fineId).single()
    if (!fine) return { statusCode: 404, body: 'fine not found' }

    await supabase.from('fines').update({ status: 'approved', decided_by: adminUserId, decided_at: new Date().toISOString() }).eq('id', fineId)
    return { statusCode: 200, body: 'approved' }
  } catch (e) {
    return { statusCode: 500, body: e.message }
  }
}

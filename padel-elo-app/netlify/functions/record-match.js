import { createClient } from '@supabase/supabase-js'

// Supabase service-klient (server-side)
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE)

// Elo helpers
const K = Number(process.env.ELO_K ?? 24)            // ← styr K i Netlify env
const round1 = (x) => Math.round(x * 10) / 10        // afrund til 1 decimal
const expectedScore = (rA, rB) => 1 / (1 + Math.pow(10, (rB - rA) / 400))

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method not allowed' }
    }

    // Auth (Bearer <token>)
    const auth = event.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { statusCode: 401, body: 'Missing auth token' }

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return { statusCode: 401, body: 'Invalid token' }

    // Input
    const input = JSON.parse(event.body || '{}')
    const { played_at, teamA, teamB, score, winner } = input
    if (!played_at || !winner || !score || !teamA || !teamB) {
      return { statusCode: 400, body: 'Missing fields' }
    }

    // Hent nuværende ratings for de spillere der er med
    const ids = [teamA?.p1, teamA?.p2, teamB?.p1, teamB?.p2].filter(Boolean)
    const { data: ratings } = await supabase
      .from('elo_ratings')
      .select('player_id, rating')
      .in('player_id', ids)

    const ratingOf = (pid) => {
      if (!pid) return null
      const r = ratings?.find((x) => x.player_id === pid)?.rating
      return typeof r === 'number' ? r : 1200
    }

    // Individuelle ratings (supporterer singler hvis p2 mangler)
    const rA1 = ratingOf(teamA?.p1) ?? 1200
    const rA2 = ratingOf(teamA?.p2) ?? null
    const rB1 = ratingOf(teamB?.p1) ?? 1200
    const rB2 = ratingOf(teamB?.p2) ?? null

    // Hold-gennemsnit (modstander-holdets gennemsnit bruges til forventning)
    const rAavg = rA2 === null ? rA1 : (rA1 + rA2) / 2
    const rBavg = rB2 === null ? rB1 : (rB1 + rB2) / 2

    const actualA = winner === 'A' ? 1 : 0
    const actualB = 1 - actualA

    // Beregn delta PR. SPILLER mod modstander-holdets gennemsnit
    const updates = []  // { pid, before, after, delta }

    if (teamA?.p1) {
      const exp = expectedScore(rA1, rBavg)
      const d = round1(K * (actualA - exp))
      updates.push({ pid: teamA.p1, before: rA1, after: round1(rA1 + d), delta: d })
    }
    if (teamA?.p2) {
      const exp = expectedScore(rA2, rBavg)
      const d = round1(K * (actualA - exp))
      updates.push({ pid: teamA.p2, before: rA2, after: round1(rA2 + d), delta: d })
    }
    if (teamB?.p1) {
      const exp = expectedScore(rB1, rAavg)
      const d = round1(K * (actualB - exp))
      updates.push({ pid: teamB.p1, before: rB1, after: round1(rB1 + d), delta: d })
    }
    if (teamB?.p2) {
      const exp = expectedScore(rB2, rAavg)
      const d = round1(K * (actualB - exp))
      updates.push({ pid: teamB.p2, before: rB2, after: round1(rB2 + d), delta: d })
    }

    // Gem kampen
    const { data: match, error: mErr } = await supabase
      .from('matches')
      .insert({
        played_at,
        team_a_player1: teamA?.p1 ?? null,
        team_a_player2: teamA?.p2 ?? null,
        team_b_player1: teamB?.p1 ?? null,
        team_b_player2: teamB?.p2 ?? null,
        score,
        winner,
        created_by: user.id
      })
      .select()
      .single()
    if (mErr) return { statusCode: 500, body: mErr.message }

    // Opdater rating og log en event pr. spiller
    for (const u of updates) {
      await supabase.from('elo_ratings').upsert({ player_id: u.pid, rating: u.after })
      await supabase.from('elo_events').insert({
        match_id: match.id,
        player_id: u.pid,
        rating_before: u.before,
        rating_after: u.after,
        k_factor: K
        // Hvis du senere tilføjer en "delta"-kolonne: delta: u.delta
      })
    }

    return { statusCode: 200, body: JSON.stringify({ id: match.id }) }
  } catch (e) {
    return { statusCode: 500, body: e.message ?? String(e) }
  }
}

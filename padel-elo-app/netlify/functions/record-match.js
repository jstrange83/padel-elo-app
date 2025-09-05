import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE)

function expectedScore(rA, rB) {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}
function updateElo(rating, score, expected, K = 24) {
  return Math.round(rating + K * (score - expected));
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
    const auth = event.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.substring(7) : null
    if (!token) return { statusCode: 401, body: 'Missing auth token' }
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return { statusCode: 401, body: 'Invalid token' }

    const input = JSON.parse(event.body || '{}')
    const { played_at, teamA, teamB, score, winner, created_by } = input
    if (!played_at || !winner || !score) return { statusCode: 400, body: 'Missing fields' }

    const ids = [teamA?.p1, teamA?.p2, teamB?.p1, teamB?.p2].filter(Boolean)
    const { data: ratings } = await supabase.from('elo_ratings').select('player_id, rating').in('player_id', ids)

    function getRating(pid) {
      return ratings?.find(r=>r.player_id===pid)?.rating ?? 1200
    }
    const rA = Math.round(((getRating(teamA?.p1) + getRating(teamA?.p2)) / (teamA?.p2?2:1)))
    const rB = Math.round(((getRating(teamB?.p1) + getRating(teamB?.p2)) / (teamB?.p2?2:1)))

    const expA = expectedScore(rA, rB)
    const expB = 1 - expA
    const scoreA = winner === 'A' ? 1 : 0
    const scoreB = 1 - scoreA

    const deltaA = updateElo(rA, scoreA, expA) - rA
    const deltaB = updateElo(rB, scoreB, expB) - rB

    const { data: match, error: mErr } = await supabase
      .from('matches').insert({
        played_at, team_a_player1: teamA?.p1, team_a_player2: teamA?.p2,
        team_b_player1: teamB?.p1, team_b_player2: teamB?.p2,
        score, winner, created_by: user.id
      }).select().single()
    if (mErr) return { statusCode: 500, body: mErr.message }

    const updates = []
    if (teamA?.p1) updates.push({ pid: teamA.p1, d: deltaA })
    if (teamA?.p2) updates.push({ pid: teamA.p2, d: deltaA })
    if (teamB?.p1) updates.push({ pid: teamB.p1, d: deltaB })
    if (teamB?.p2) updates.push({ pid: teamB.p2, d: deltaB })

    for (const u of updates) {
      const { data: cur } = await supabase.from('elo_ratings').select('rating').eq('player_id', u.pid).single()
      const before = cur?.rating ?? 1200
      const after = before + u.d
      await supabase.from('elo_ratings').upsert({ player_id: u.pid, rating: after })
      await supabase.from('elo_events').insert({ match_id: match.id, player_id: u.pid, rating_before: before, rating_after: after, k_factor: 24 })
    }

    return { statusCode: 200, body: JSON.stringify({ id: match.id }) }
  } catch (e) {
    return { statusCode: 500, body: e.message }
  }
}

import { createClient } from '@supabase/supabase-js'

// Server-side Supabase-klient
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

// K-faktor fra env (fallback 24)
const K = Number(process.env.ELO_K || '24')

// Elo-forventning mellem to spillere
function expectedScore(rA, rB) {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400))
}

// 1-decimal afrunding
const round1 = (x) => Math.round(x * 10) / 10

// Parse padel-score til samlet antal games og fraktion per hold.
// Understøtter fx "6-4", "6-3, 3-6, 7-5", ignorerer tie-break-paranteser.
function parseScoreToGameFractions(scoreStr, winner) {
  if (typeof scoreStr !== 'string') {
    return { sA: winner === 'A' ? 1 : 0, sB: winner === 'A' ? 0 : 1, gA: 0, gB: 0 }
  }
  const tokens = scoreStr.split(',').map(t => t.trim()).filter(Boolean)
  let gA = 0, gB = 0
  for (const t of tokens) {
    const m = t.match(/(\d+)\D+(\d+)/) // to første tal i sættet
    if (!m) continue
    const a = Number(m[1]), b = Number(m[2])
    if (Number.isFinite(a) && Number.isFinite(b)) {
      gA += a; gB += b
    }
  }
  const total = gA + gB
  if (total <= 0) {
    return { sA: winner === 'A' ? 1 : 0, sB: winner === 'A' ? 0 : 1, gA, gB }
  }
  return { sA: gA / total, sB: gB / total, gA, gB }
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method not allowed' }
    }

    // Auth via Bearer-token
    const auth = event.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { statusCode: 401, body: 'Missing auth token' }

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !user) return { statusCode: 401, body: 'Invalid token' }

    // Input
    const input = JSON.parse(event.body || '{}')
    const { played_at, teamA, teamB, score, winner } = input
    if (!played_at || !winner || !score || !teamA || !teamB) {
      return { statusCode: 400, body: 'Missing fields' }
    }

    // Saml spiller-ids
    const aIds = [teamA?.p1, teamA?.p2].filter(Boolean)
    const bIds = [teamB?.p1, teamB?.p2].filter(Boolean)
    const allIds = [...aIds, ...bIds]
    if (allIds.length === 0) return { statusCode: 400, body: 'No players provided' }

    // Hent nuværende ratings
    const { data: rows, error: rErr } = await supabase
      .from('elo_ratings')
      .select('player_id, rating')
      .in('player_id', allIds)
    if (rErr) return { statusCode: 500, body: rErr.message }

    const ratingMap = new Map(rows?.map(r => [r.player_id, Number(r.rating)]) || [])
    const getRating = (pid) => {
      const r = ratingMap.get(pid)
      return Number.isFinite(r) ? r : 1200
    }

    // Faktisk score som fraktion af vundne games (resultat-vægtning)
    const { sA, sB } = parseScoreToGameFractions(score, winner)

    // Individuelle deltas: E = gennemsnit af forventning mod hver modstander (1v1)
    function individualDeltas(playerIds, opponentIds, teamScore) {
      const oppRatings = opponentIds.map(getRating)
      return playerIds.map(pid => {
        const before = getRating(pid)
        let E = 0.5
        if (oppRatings.length > 0) {
          E = oppRatings.map(or => expectedScore(before, or))
                        .reduce((a, b) => a + b, 0) / oppRatings.length
        }
        const delta = round1(K * (teamScore - E))
        const after = round1(before + delta)
        return { pid, before, after, delta, expected: E }
      })
    }

    const changesA = individualDeltas(aIds, bIds, sA)
    const changesB = individualDeltas(bIds, aIds, sB)
    const allChanges = [...changesA, ...changesB]

    // Gem kampen
    const { data: match, error: mErr } = await supabase
      .from('matches')
      .insert({
        played_at,
        team_a_player1: teamA?.p1 ?? null,
        team_a_player2: teamA?.p2 ?? null,
        team_b_player1: teamB?.p1 ?? null,
        team_b_player2: teamB?.p2 ?? null,
        score,  // fx "6-4" eller "6-3, 3-6, 7-5"
        winner,
        created_by: user.id
      })
      .select()
      .single()
    if (mErr) return { statusCode: 500, body: mErr.message }

    // Opdater rating og log event pr. spiller
    for (const ch of allChanges) {
      await supabase.from('elo_ratings').upsert({ player_id: ch.pid, rating: ch.after })
      await supabase.from('elo_events').insert({
        match_id: match.id,
        player_id: ch.pid,
        rating_before: ch.before,
        rating_after: ch.after,
        k_factor: K
        // Hvis du senere får kolonner som "delta" / "expected":
        // delta: ch.delta,
        // expected: round1(ch.expected),
      })
    }

    return { statusCode: 200, body: JSON.stringify({ id: match.id, changes: allChanges }) }
  } catch (e) {
    return { statusCode: 500, body: e.message ?? String(e) }
  }
}

export type Player = { id: string; nickname: string }
export type FineType = { id: string; title: string; amount_cents: number; active: boolean }
export type Fine = {
  id: string; fine_type_id: string; issuer_id: string; target_player_id: string;
  comment: string | null; status: 'pending'|'approved'|'rejected'; amount_cents: number; created_at: string
}

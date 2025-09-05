# Padel Elo Rangliste (Netlify + Supabase)

Dette repo er klar til upload på Netlify. Følg disse trin:

## 1) Supabase
- Opret et projekt på supabase.com
- Gå til **SQL Editor** og kør `./supabase/schema.sql` (kopiér indholdet og kør det).
- Opret evt. din egen bruger i Auth (Sign Up via app'en kan også bruges). Sæt admin-flag ved behov:

```sql
update public.profiles set is_admin = true where id = '<DIT_USER_ID>';
```

## 2) Netlify Environment Variables
I dit Netlify-site, under **Site settings → Environment variables** tilføj:
- `VITE_SUPABASE_URL` = din Supabase URL
- `VITE_SUPABASE_ANON_KEY` = din Supabase anon key
- `SUPABASE_SERVICE_ROLE` = din Supabase service role key (bruges KUN i serverless functions)

> **Vigtigt:** Service role må aldrig bruges i browser-kode.

## 3) Deploy
- Push koden til GitHub (eller drag-drop mappen/dist i Netlify).
- For "New site from Git": vælg repo, byg med `npm run build`, publish dir `dist`.
- Netlify registrerer functions i `netlify/functions` automatisk.

## 4) Login og første opsætning
- Opret bruger via "Log ind" → "Opret bruger" i app'en (vælg nickname).
- (Valgfrit) Gør din bruger til admin via SQL (se ovenfor).
- Opret bøde-typer under **Admin**.
- Registrér kampe under **Ny kamp**. Elo opdateres automatisk via function.

## Struktur
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Supabase (Postgres, Auth, RLS)
- Serverless: Netlify Functions (`approve-fine.js`, `record-match.js`)

Held og lykke! 🎾

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { email, role, client_id } = await req.json()
    if (!email || !role) throw new Error('email and role zijn verplicht')

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { role, client_id: client_id ?? null },
      redirectTo: 'https://zitcomfort-dashboard-evpblgm3k-kasper-1493s-projects.vercel.app/dashboard',
    })
    if (error) throw error

    await admin.from('profiles').upsert({
      id: data.user.id,
      role,
      client_id: client_id ?? null,
      email,
    }, { onConflict: 'id' })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = (typeof err === 'object' && err !== null)
      ? (err.message ?? err.error_description ?? JSON.stringify(err))
      : String(err)
    console.error('invite-user error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})

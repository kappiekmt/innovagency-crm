import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  client: 'Klant',
}

const ROLE_DESC: Record<string, string> = {
  owner: 'Je hebt volledige toegang tot het Innovagency dashboard.',
  admin: 'Je hebt toegang tot het Innovagency admin dashboard.',
  client: 'Je kunt je campagne-statistieken bekijken in je persoonlijk dashboard.',
}

function buildEmail(email: string, role: string, inviteUrl: string): string {
  const label = ROLE_LABEL[role] ?? role
  const desc  = ROLE_DESC[role] ?? ''

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Uitnodiging – Innovagency Dashboard</title>
</head>
<body style="margin:0;padding:0;background:#0a0c10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c10;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111318;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#0d0f14;padding:28px 40px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;height:36px;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.2);border-radius:10px;text-align:center;vertical-align:middle;">
                    <span style="font-size:18px;line-height:36px;">⚡</span>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="font-size:15px;font-weight:700;color:#f4f4f5;">Innovagency</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f4f4f5;">Je bent uitgenodigd 🎉</p>
              <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">${desc}</p>

              <!-- Role badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:4px 12px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);border-radius:999px;">
                    <span style="font-size:12px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:0.05em;">${label}</span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:13px;color:#52525b;">Uitgenodigd als:</p>
              <p style="margin:0 0 32px;font-size:14px;color:#a1a1aa;">${email}</p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#3b82f6;border-radius:10px;">
                    <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">
                      Uitnodiging accepteren →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:12px;color:#3f3f46;line-height:1.6;">
                Deze link is 24 uur geldig. Klik je liever niet op de knop? Kopieer dan de URL hieronder:
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#3f3f46;word-break:break-all;">${inviteUrl}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);background:#0d0f14;">
              <p style="margin:0;font-size:12px;color:#3f3f46;">
                Heb je vragen? Neem contact op via
                <a href="mailto:kasper@innovagency.nl" style="color:#52525b;">kasper@innovagency.nl</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
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
    if (!email || !role) throw new Error('email en role zijn verplicht')

    // Generate invite link silently (does NOT send Supabase's generic email)
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: { role, client_id: client_id ?? null },
        redirectTo: 'https://app.innovagency.nl',
      },
    })
    if (linkError) throw linkError

    // Upsert profile immediately so the role is ready when user lands
    await admin.from('profiles').upsert({
      id: linkData.user.id,
      role,
      client_id: client_id ?? null,
      email,
    }, { onConflict: 'id' })

    // Send branded email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) throw new Error('RESEND_API_KEY is not set')

    const inviteUrl = linkData.properties?.action_link
    if (!inviteUrl) throw new Error('Kon geen invite link genereren')

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Innovagency <noreply@innovagency.nl>',
        to: [email],
        subject: 'Je bent uitgenodigd voor het Innovagency dashboard',
        html: buildEmail(email, role, inviteUrl),
      }),
    })

    if (!resendRes.ok) {
      const resendErr = await resendRes.json().catch(() => ({}))
      throw new Error(`Resend fout: ${resendErr.message ?? resendRes.status}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = (typeof err === 'object' && err !== null)
      ? ((err as any).message ?? (err as any).error_description ?? JSON.stringify(err))
      : String(err)
    console.error('invite-user error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})

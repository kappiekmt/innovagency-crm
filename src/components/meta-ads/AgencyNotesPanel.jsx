import { useEffect, useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const CONTEXT = 'meta_video_ads';

export default function AgencyNotesPanel({ clientSlug, clientColor = '#6C00EE' }) {
  const { session, supaSession } = useAuth();
  const isAdmin = ['admin', 'owner', 'account_manager', 'team_member'].includes(session?.role);
  const userEmail = supaSession?.user?.email ?? null;
  const [note, setNote] = useState(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from('agency_notes')
        .select('content, updated_at, updated_by')
        .eq('client_slug', clientSlug)
        .eq('context', CONTEXT)
        .maybeSingle();
      if (cancelled) return;
      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        setTableMissing(true);
        return;
      }
      setNote(data ?? { content: '' });
      setDraft(data?.content ?? '');
    }
    load();
    return () => { cancelled = true; };
  }, [clientSlug]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from('agency_notes')
      .upsert({
        client_slug: clientSlug,
        context: CONTEXT,
        content: draft,
        updated_at: new Date().toISOString(),
        updated_by: userEmail ?? null,
      }, { onConflict: 'client_slug,context' });
    setSaving(false);
    if (!error) {
      setNote({ content: draft, updated_at: new Date().toISOString(), updated_by: userEmail });
      setEditing(false);
    } else {
      console.error('[agency_notes] save error:', error);
    }
  }

  if (tableMissing) {
    return (
      <div style={{
        background: '#111318', border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${clientColor}`,
        borderRadius: 14, padding: '16px 20px', fontSize: 12.5, color: '#a1a1aa',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: clientColor, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
          Notities van het agency
        </div>
        Run de migratie <code style={{ background: '#1a1d24', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>supabase/agency-notes-migration.sql</code> om dit veld te activeren.
      </div>
    );
  }

  return (
    <div style={{
      background: '#111318', border: '1px solid rgba(255,255,255,0.06)',
      borderLeft: `3px solid ${clientColor}`,
      borderRadius: 14, padding: '18px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: clientColor, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Notities van het agency
        </div>
        {isAdmin && !editing && (
          <button
            onClick={() => { setDraft(note?.content ?? ''); setEditing(true); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
              color: '#a1a1aa', fontSize: 11, fontFamily: 'inherit', fontWeight: 500,
            }}
          >
            <Pencil size={11} /> Bewerk
          </button>
        )}
      </div>

      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder="Schrijf hier observaties, hypotheses, of aandachtspunten voor de klant…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#0d0f14', border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 8, padding: '10px 12px',
              color: '#e4e4e7', fontSize: 13, lineHeight: 1.5,
              fontFamily: 'inherit', resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: clientColor, border: 'none',
                borderRadius: 7, padding: '7px 14px', cursor: 'pointer',
                color: '#fff', fontSize: 12, fontFamily: 'inherit', fontWeight: 600,
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Save size={12} /> {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
            <button
              onClick={() => { setEditing(false); setDraft(note?.content ?? ''); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 7, padding: '7px 14px', cursor: 'pointer',
                color: '#a1a1aa', fontSize: 12, fontFamily: 'inherit',
              }}
            >
              <X size={12} /> Annuleer
            </button>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, lineHeight: 1.6, color: '#d4d4d8', whiteSpace: 'pre-wrap' }}>
          {note?.content?.trim()
            ? note.content
            : <span style={{ color: '#71717a', fontStyle: 'italic' }}>Nog geen notities toegevoegd.</span>}
        </div>
      )}
    </div>
  );
}

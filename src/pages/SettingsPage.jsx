import { useState, useEffect } from 'react';
import { Save, UserPlus, Trash2, Shield, User } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const INPUT = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  background: '#0D0F12', border: '1px solid rgba(255,255,255,0.1)',
  color: '#F4F4F5', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
const LABEL = { fontSize: 11, fontWeight: 600, color: '#71717A', marginBottom: 6, display: 'block' };
const CARD  = { background: '#161A1F', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: '24px' };

export default function SettingsPage() {
  const { toast } = useToast();
  const [clients, setClients]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [savingTargets, setSavingTargets] = useState({});
  const [targets, setTargets]           = useState({});
  const [agencyName, setAgencyName]     = useState('Innovagency');

  // Team state
  const [team, setTeam]                 = useState([]);
  const [teamLoading, setTeamLoading]   = useState(true);
  const [inviteForm, setInviteForm]     = useState({ email: '', role: 'admin', client_id: '' });
  const [inviting, setInviting]         = useState(false);
  const [removingId, setRemovingId]     = useState(null);

  useEffect(() => { fetchAll(); fetchTeam(); }, []);

  async function fetchAll() {
    const { data } = await supabase.from('clients').select('id, name, slug, cpa_target, roas_target, status').order('name');
    const c = data ?? [];
    setClients(c);
    const t = {};
    c.forEach(cl => { t[cl.id] = { cpa_target: cl.cpa_target ?? '', roas_target: cl.roas_target ?? '' }; });
    setTargets(t);
    setLoading(false);
  }

  async function fetchTeam() {
    setTeamLoading(true);
    const { data } = await supabase.from('profiles').select('id, role, client_id, email').order('role');
    setTeam(data ?? []);
    setTeamLoading(false);
  }

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteForm.email) return;
    setInviting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_JWT ?? import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: inviteForm.email.trim(),
          role: inviteForm.role,
          client_id: inviteForm.role === 'client' ? inviteForm.client_id || null : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? json.message ?? `Fout ${res.status}`);
      toast(`Uitnodiging verstuurd naar ${inviteForm.email}`, 'success');
      setInviteForm({ email: '', role: 'admin', client_id: '' });
      fetchTeam();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(member) {
    if (!window.confirm(`Verwijder toegang voor ${member.email ?? member.id}?`)) return;
    setRemovingId(member.id);
    const { error } = await supabase.from('profiles').delete().eq('id', member.id);
    setRemovingId(null);
    if (error) { toast(error.message, 'error'); return; }
    setTeam(prev => prev.filter(m => m.id !== member.id));
    toast('Teamlid verwijderd', 'success');
  }

  async function saveTargets(clientId, clientName) {
    setSavingTargets(prev => ({ ...prev, [clientId]: true }));
    const { error } = await supabase.from('clients').update({
      cpa_target:  targets[clientId]?.cpa_target  ? parseFloat(targets[clientId].cpa_target)  : null,
      roas_target: targets[clientId]?.roas_target ? parseFloat(targets[clientId].roas_target) : null,
    }).eq('id', clientId);
    setSavingTargets(prev => ({ ...prev, [clientId]: false }));
    if (error) toast(error.message, 'error');
    else toast(`Doelen opgeslagen voor ${clientName}`, 'success');
  }

  async function toggleStatus(client) {
    const newStatus = client.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase.from('clients').update({ status: newStatus }).eq('id', client.id);
    if (!error) {
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: newStatus } : c));
      toast(`${client.name} is nu ${newStatus === 'active' ? 'actief' : 'gepauzeerd'}`, 'success');
    }
  }

  return (
    <AdminLayout>
      <div style={{ padding: '36px 40px', maxWidth: 900 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F4F4F5', marginBottom: 4 }}>Instellingen</h1>
          <p style={{ fontSize: 13, color: '#71717A' }}>Beheer agency-instellingen en klantdoelen</p>
        </div>

        {/* Agency info */}
        <div style={{ ...CARD, marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#F4F4F5', marginBottom: 20 }}>Agency informatie</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={LABEL}>Agency naam</label>
              <input style={INPUT} value={agencyName} onChange={e => setAgencyName(e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Standaard valuta</label>
              <input style={{ ...INPUT, color: '#71717A' }} value="Euro (€)" disabled />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => toast('Instellingen opgeslagen', 'success')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Save size={13} /> Opslaan
            </button>
          </div>
        </div>

        {/* Team */}
        <div style={{ ...CARD, marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#F4F4F5', marginBottom: 4 }}>Team</h2>
          <p style={{ fontSize: 12, color: '#71717A', marginBottom: 20 }}>Teamleden ontvangen een uitnodigingsmail om een account aan te maken.</p>

          {/* Existing members */}
          {teamLoading ? (
            <p style={{ fontSize: 13, color: '#52525B', marginBottom: 20 }}>Laden…</p>
          ) : team.length === 0 ? (
            <p style={{ fontSize: 13, color: '#52525B', marginBottom: 20 }}>Nog geen teamleden.</p>
          ) : (
            <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {team.map((m, i) => {
                const clientName = clients.find(c => c.id === m.client_id)?.name;
                return (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: i < team.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: m.role === 'admin' ? 'rgba(59,130,246,0.12)' : 'rgba(34,197,94,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {m.role === 'admin'
                          ? <Shield size={14} color="#3B82F6" />
                          : <User size={14} color="#22C55E" />}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F5' }}>{m.email ?? m.id}</p>
                        <p style={{ fontSize: 11, color: '#52525B', marginTop: 1 }}>
                          {m.role === 'admin' ? 'Admin' : `Klant${clientName ? ` · ${clientName}` : ''}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(m)}
                      disabled={removingId === m.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)',
                        background: 'rgba(239,68,68,0.07)', color: '#EF4444',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        opacity: removingId === m.id ? 0.5 : 1,
                      }}
                    >
                      <Trash2 size={11} /> Verwijderen
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Invite form */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#A1A1AA', marginBottom: 14 }}>Nieuw teamlid uitnodigen</p>
            <form onSubmit={handleInvite}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 10, alignItems: 'flex-end' }}>
                <div>
                  <label style={LABEL}>E-mailadres</label>
                  <input
                    type="email" required
                    placeholder="naam@bedrijf.nl"
                    style={INPUT}
                    value={inviteForm.email}
                    onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={LABEL}>Rol</label>
                  <select
                    style={INPUT}
                    value={inviteForm.role}
                    onChange={e => setInviteForm(f => ({ ...f, role: e.target.value, client_id: '' }))}
                  >
                    <option value="admin">Admin</option>
                    <option value="client">Klant</option>
                  </select>
                </div>
                {inviteForm.role === 'client' && (
                  <div>
                    <label style={LABEL}>Klant</label>
                    <select
                      style={INPUT}
                      value={inviteForm.client_id}
                      onChange={e => setInviteForm(f => ({ ...f, client_id: e.target.value }))}
                    >
                      <option value="">— Kies klant —</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ paddingBottom: 1 }}>
                  <button
                    type="submit"
                    disabled={inviting}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600,
                      fontFamily: 'inherit', whiteSpace: 'nowrap',
                      opacity: inviting ? 0.7 : 1,
                    }}
                  >
                    <UserPlus size={13} /> {inviting ? 'Bezig…' : 'Uitnodigen'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Client targets */}
        <div style={CARD}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#F4F4F5', marginBottom: 4 }}>Klantdoelen & status</h2>
          <p style={{ fontSize: 12, color: '#71717A', marginBottom: 20 }}>Stel CPA- en ROAS-doelen in per klant. De health score wordt hier op gebaseerd.</p>

          {loading ? (
            <p style={{ fontSize: 13, color: '#52525B' }}>Laden…</p>
          ) : clients.length === 0 ? (
            <p style={{ fontSize: 13, color: '#52525B' }}>Geen klanten gevonden. Voeg klanten toe via de klantenpagina.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {clients.map((c, i) => (
                <div key={c.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 140px 140px 120px 100px',
                  gap: 12, alignItems: 'center', padding: '16px 0',
                  borderBottom: i < clients.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F5' }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: '#52525B' }}>{c.slug}</p>
                  </div>
                  <div>
                    <label style={{ ...LABEL, fontSize: 10 }}>CPA-doel (€)</label>
                    <input
                      type="number" step="0.01" style={{ ...INPUT, padding: '7px 10px', fontSize: 12 }}
                      value={targets[c.id]?.cpa_target ?? ''}
                      placeholder="45.00"
                      onChange={e => setTargets(prev => ({ ...prev, [c.id]: { ...prev[c.id], cpa_target: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ ...LABEL, fontSize: 10 }}>ROAS-doel</label>
                    <input
                      type="number" step="0.1" style={{ ...INPUT, padding: '7px 10px', fontSize: 12 }}
                      value={targets[c.id]?.roas_target ?? ''}
                      placeholder="3.5"
                      onChange={e => setTargets(prev => ({ ...prev, [c.id]: { ...prev[c.id], roas_target: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ ...LABEL, fontSize: 10 }}>Status</label>
                    <button
                      onClick={() => toggleStatus(c)}
                      style={{
                        width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                        background: c.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(113,113,122,0.1)',
                        color: c.status === 'active' ? '#22C55E' : '#71717A',
                        border: `1px solid ${c.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(113,113,122,0.2)'}`,
                      }}
                    >
                      {c.status === 'active' ? 'Actief' : 'Gepauzeerd'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 0 }}>
                    <button
                      onClick={() => saveTargets(c.id, c.name)}
                      disabled={savingTargets[c.id]}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, marginTop: 16,
                        padding: '7px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                        color: '#3B82F6', fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                        opacity: savingTargets[c.id] ? 0.6 : 1,
                      }}
                    >
                      <Save size={11} /> {savingTargets[c.id] ? '…' : 'Opslaan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ marginTop: 24, padding: '16px 20px', borderRadius: 10, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
          <p style={{ fontSize: 12, color: '#71717A' }}>
            <strong style={{ color: '#A1A1AA' }}>Health score logica:</strong> 🟢 Groen = data ingevoerd deze week + CPA ≤ doel · 🟡 Oranje = data ingevoerd maar CPA &gt; doel (of geen doel ingesteld) · 🔴 Rood = geen data ingevoerd deze week
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

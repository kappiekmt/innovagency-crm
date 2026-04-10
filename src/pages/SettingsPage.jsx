import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
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
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTargets, setSavingTargets] = useState({});
  const [targets, setTargets] = useState({});
  const [agencyName, setAgencyName] = useState('Innovagency');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const { data } = await supabase.from('clients').select('id, name, slug, cpa_target, roas_target').order('name');
    const c = data ?? [];
    setClients(c);
    const t = {};
    c.forEach(cl => { t[cl.id] = { cpa_target: cl.cpa_target ?? '', roas_target: cl.roas_target ?? '' }; });
    setTargets(t);
    setLoading(false);
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, X } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(12, 0, 0, 0); // noon avoids DST edge cases
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function fmtEur(n) { return n != null ? '€' + Number(n).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'; }
function fmt(n)    { return n != null ? Number(n).toLocaleString('nl-NL') : '—'; }

const CARD = { background: '#161A1F', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' };
const INPUT_STYLE = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  background: '#0D0F12', border: '1px solid rgba(255,255,255,0.1)',
  color: '#F4F4F5', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
const LABEL = { fontSize: 11, fontWeight: 600, color: '#71717A', marginBottom: 6, display: 'block' };

function toSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}

export default function ClientsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [weekStats, setWeekStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', cpa_target: '', roas_target: '', status: 'active' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const ws = getWeekStart();
    const [cRes, sRes] = await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('weekly_stats').select('*').eq('week_start', ws),
    ]);
    setClients(cRes.data ?? []);
    setWeekStats(sRes.data ?? []);
    setLoading(false);
  }

  function getHealth(client, stats) {
    const tw = stats.find(s => s.client_id === client.id);
    if (!tw) return 'red';
    const spend = (tw.meta_spend ?? 0) + (tw.google_spend ?? 0);
    const conv  = (tw.meta_conversions ?? 0) + (tw.google_conversions ?? 0) + (tw.organic_conversions ?? 0);
    const cpa   = conv > 0 ? spend / conv : null;
    if (client.cpa_target && cpa != null && cpa <= client.cpa_target) return 'green';
    return 'orange';
  }

  const filtered = clients.filter(c => filter === 'all' || c.status === filter);
  const healthColor = { green: '#22C55E', orange: '#EAB308', red: '#EF4444' };
  const healthLabel = { green: 'Goed', orange: 'Let op', red: 'Geen data' };

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || toSlug(form.name),
      status: form.status,
      cpa_target: form.cpa_target ? parseFloat(form.cpa_target) : null,
      roas_target: form.roas_target ? parseFloat(form.roas_target) : null,
    };
    const { data, error } = await supabase.from('clients').insert([payload]).select().single();
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    setClients(prev => [...prev, data]);
    await supabase.from('activity_log').insert([{ client_id: data.id, action: `Klant aangemaakt: ${data.name}` }]);
    toast('Klant aangemaakt', 'success');
    setShowModal(false);
    setForm({ name: '', slug: '', cpa_target: '', roas_target: '', status: 'active' });
  }

  return (
    <AdminLayout>
      <div style={{ padding: '36px 40px', maxWidth: 1200 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F4F4F5', marginBottom: 4 }}>Klanten</h1>
            <p style={{ fontSize: 13, color: '#71717A' }}>{clients.length} klant{clients.length !== 1 ? 'en' : ''} in totaal</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Status filter */}
            <div style={{ display: 'flex', gap: 4, background: '#161A1F', borderRadius: 8, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
              {['all', 'active', 'paused'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontFamily: 'inherit', fontWeight: filter === f ? 600 : 400,
                  background: filter === f ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: filter === f ? '#F4F4F5' : '#71717A',
                  transition: 'all 0.15s',
                }}>
                  {f === 'all' ? 'Alle' : f === 'active' ? 'Actief' : 'Gepauzeerd'}
                </button>
              ))}
            </div>
            <button onClick={() => setShowModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Plus size={14} /> Nieuwe klant
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ ...CARD, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Klant', 'Status', 'Spend (week)', 'Conversies (week)', 'CPA', 'Health', 'Acties'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, color: '#52525B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(3)].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.05)', width: j === 0 ? 120 : 60 }} />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && filtered.map((c, i) => {
                const tw = weekStats.find(s => s.client_id === c.id);
                const spend = tw ? (tw.meta_spend ?? 0) + (tw.google_spend ?? 0) : null;
                const conv  = tw ? (tw.meta_conversions ?? 0) + (tw.google_conversions ?? 0) + (tw.organic_conversions ?? 0) : null;
                const cpa   = conv > 0 ? spend / conv : null;
                const health = getHealth(c, weekStats);
                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.slug}`)}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      cursor: 'pointer', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F5' }}>{c.name}</p>
                      <p style={{ fontSize: 11, color: '#52525B', marginTop: 2 }}>{c.slug}</p>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
                        background: c.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(113,113,122,0.1)',
                        color: c.status === 'active' ? '#22C55E' : '#71717A',
                        border: `1px solid ${c.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(113,113,122,0.2)'}`,
                      }}>
                        {c.status === 'active' ? 'Actief' : 'Gepauzeerd'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#A1A1AA', fontVariantNumeric: 'tabular-nums' }}>{spend != null ? fmtEur(spend) : '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#A1A1AA', fontVariantNumeric: 'tabular-nums' }}>{conv  != null ? fmt(conv)    : '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#A1A1AA', fontVariantNumeric: 'tabular-nums' }}>{cpa   != null ? fmtEur(cpa) : '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: healthColor[health], boxShadow: `0 0 5px ${healthColor[health]}88` }} />
                        <span style={{ fontSize: 11, color: healthColor[health] }}>{healthLabel[health]}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/client/${c.slug}`); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 10px', borderRadius: 6,
                          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                          color: '#3B82F6', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        <ExternalLink size={11} /> Dashboard
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: '#52525B' }}>
                  {clients.length === 0 ? 'Nog geen klanten toegevoegd.' : 'Geen klanten gevonden.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
          }} onClick={() => setShowModal(false)}>
            <div style={{ background: '#161A1F', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: 32, width: 480, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F4F4F5' }}>Nieuwe klant</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717A' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={LABEL}>Naam *</label>
                    <input required style={INPUT_STYLE} value={form.name} placeholder="Bijv. Zitcomfort B.V."
                      onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: toSlug(e.target.value) }))} />
                  </div>
                  <div>
                    <label style={LABEL}>Slug (URL-id)</label>
                    <input style={INPUT_STYLE} value={form.slug} placeholder="zitcomfort-bv"
                      onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={LABEL}>CPA-doel (€)</label>
                      <input type="number" step="0.01" style={INPUT_STYLE} value={form.cpa_target} placeholder="45.00"
                        onChange={e => setForm(f => ({ ...f, cpa_target: e.target.value }))} />
                    </div>
                    <div>
                      <label style={LABEL}>ROAS-doel</label>
                      <input type="number" step="0.1" style={INPUT_STYLE} value={form.roas_target} placeholder="3.5"
                        onChange={e => setForm(f => ({ ...f, roas_target: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={LABEL}>Status</label>
                    <select style={{ ...INPUT_STYLE }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="active">Actief</option>
                      <option value="paused">Gepauzeerd</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#71717A', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annuleren</button>
                  <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Bezig…' : 'Aanmaken'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

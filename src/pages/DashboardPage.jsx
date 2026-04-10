import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingDown, Activity, ArrowRight } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';

function getWeekStart(offset = 0) {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  d.setDate(diff);
  d.setHours(12, 0, 0, 0); // noon avoids DST edge cases
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function fmtEur(n) {
  if (n == null || isNaN(n)) return '—';
  return '€' + Number(n).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('nl-NL');
}

const CARD_STYLE = {
  background: '#161A1F', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [thisWeek, setThisWeek] = useState([]);
  const [lastWeek, setLastWeek] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const ws = getWeekStart(0);
    const lws = getWeekStart(-1);

    const [cRes, twRes, lwRes, aRes] = await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('weekly_stats').select('*').eq('week_start', ws),
      supabase.from('weekly_stats').select('*').eq('week_start', lws),
      supabase.from('activity_log').select('*, clients(name)').order('created_at', { ascending: false }).limit(10),
    ]);

    setClients(cRes.data ?? []);
    setThisWeek(twRes.data ?? []);
    setLastWeek(lwRes.data ?? []);
    setActivity(aRes.data ?? []);
    setLoading(false);
  }

  const activeClients = clients.filter(c => c.status === 'active');

  const totalSpend = thisWeek.reduce((s, r) => s + (r.meta_spend ?? 0) + (r.google_spend ?? 0), 0);
  const totalConv  = thisWeek.reduce((s, r) => s + (r.meta_conversions ?? 0) + (r.google_conversions ?? 0) + (r.organic_conversions ?? 0), 0);
  const avgCpa     = totalConv > 0 ? totalSpend / totalConv : 0;

  const clientPerf = activeClients.map(c => {
    const tw = thisWeek.find(s => s.client_id === c.id);
    const lw = lastWeek.find(s => s.client_id === c.id);
    const spend = tw ? (tw.meta_spend ?? 0) + (tw.google_spend ?? 0) : null;
    const conv  = tw ? (tw.meta_conversions ?? 0) + (tw.google_conversions ?? 0) + (tw.organic_conversions ?? 0) : null;
    const cpa   = conv > 0 ? spend / conv : null;
    const lwConv = lw ? (lw.meta_conversions ?? 0) + (lw.google_conversions ?? 0) + (lw.organic_conversions ?? 0) : null;
    const trend  = lwConv != null && lwConv > 0 && conv != null ? ((conv - lwConv) / lwConv) * 100 : null;

    let health = 'red';
    if (tw) health = (c.cpa_target && cpa != null && cpa <= c.cpa_target) ? 'green' : 'orange';

    return { ...c, spend, conv, cpa, trend, health, hasData: !!tw };
  });

  const noDataAlerts = clientPerf.filter(c => !c.hasData);
  const dropAlerts   = clientPerf.filter(c => c.trend !== null && c.trend < -20);

  const healthColor = { green: '#22C55E', orange: '#EAB308', red: '#EF4444' };

  return (
    <AdminLayout>
      <div style={{ padding: '36px 40px', maxWidth: 1280 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F4F4F5', marginBottom: 4 }}>Agency Dashboard</h1>
          <p style={{ fontSize: 13, color: '#71717A' }}>Weekoverzicht van alle actieve klanten</p>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Totale Ad Spend',    value: loading ? '…' : fmtEur(totalSpend) },
            { label: 'Totale Conversies',  value: loading ? '…' : fmt(totalConv)     },
            { label: 'Gemiddelde CPA',     value: loading ? '…' : fmtEur(avgCpa)     },
            { label: 'Actieve Klanten',    value: loading ? '…' : String(activeClients.length) },
          ].map(({ label, value }) => (
            <div key={label} style={CARD_STYLE}>
              <p style={{ fontSize: 11, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, fontWeight: 600 }}>{label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#F4F4F5', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {(noDataAlerts.length > 0 || dropAlerts.length > 0) && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Meldingen</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {noDataAlerts.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 16px', borderRadius: 10,
                  background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
                }}>
                  <AlertTriangle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#F4F4F5' }}>
                    <strong>{c.name}</strong> — Nog geen data ingevoerd deze week
                  </span>
                  <button
                    onClick={() => navigate(`/clients/${c.slug}`)}
                    style={{ marginLeft: 'auto', fontSize: 12, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Voeg toe →
                  </button>
                </div>
              ))}
              {dropAlerts.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 16px', borderRadius: 10,
                  background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.2)',
                }}>
                  <TrendingDown size={14} color="#EAB308" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#F4F4F5' }}>
                    <strong>{c.name}</strong> — Conversiedaling van {Math.abs(c.trend).toFixed(0)}% t.o.v. vorige week
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Performance table */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Prestaties per klant</p>
            <div style={{ ...CARD_STYLE, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Klant', 'Spend', 'Conversies', 'CPA', 'Trend', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '11px 16px', textAlign: 'left', fontSize: 10,
                        color: '#52525B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientPerf.map((c, i) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/clients/${c.slug}`)}
                      style={{
                        borderBottom: i < clientPerf.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        cursor: 'pointer', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: '#F4F4F5' }}>{c.name}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#A1A1AA', fontVariantNumeric: 'tabular-nums' }}>{c.spend != null ? fmtEur(c.spend) : '—'}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#A1A1AA', fontVariantNumeric: 'tabular-nums' }}>{c.conv  != null ? fmt(c.conv)  : '—'}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#A1A1AA', fontVariantNumeric: 'tabular-nums' }}>{c.cpa   != null ? fmtEur(c.cpa) : '—'}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12 }}>
                        {c.trend != null ? (
                          <span style={{ color: c.trend >= 0 ? '#22C55E' : '#EF4444' }}>
                            {c.trend >= 0 ? '↑' : '↓'} {Math.abs(c.trend).toFixed(0)}%
                          </span>
                        ) : <span style={{ color: '#3F3F46' }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{
                          width: 9, height: 9, borderRadius: '50%',
                          background: healthColor[c.health],
                          boxShadow: `0 0 6px ${healthColor[c.health]}88`,
                        }} />
                      </td>
                    </tr>
                  ))}
                  {clientPerf.length === 0 && !loading && (
                    <tr><td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: '#52525B' }}>
                      Nog geen klanten. <button onClick={() => navigate('/clients')} style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Voeg er een toe →</button>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity feed */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Recente activiteit</p>
            <div style={{ ...CARD_STYLE }}>
              {activity.length === 0 ? (
                <p style={{ fontSize: 13, color: '#52525B', textAlign: 'center', padding: '16px 0' }}>Nog geen activiteit geregistreerd.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {activity.map(a => (
                    <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 7,
                        background: 'rgba(59,130,246,0.1)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Activity size={12} color="#3B82F6" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, color: '#F4F4F5', lineHeight: 1.4 }}>{a.action}</p>
                        {a.clients?.name && <p style={{ fontSize: 11, color: '#3B82F6', marginTop: 2 }}>{a.clients.name}</p>}
                        {a.detail && <p style={{ fontSize: 11, color: '#52525B', marginTop: 1 }}>{a.detail}</p>}
                        <p style={{ fontSize: 10, color: '#3F3F46', marginTop: 3 }}>
                          {new Date(a.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

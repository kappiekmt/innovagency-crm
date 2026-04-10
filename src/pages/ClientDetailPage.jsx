import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExternalLink, Plus, X, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const TABS = ['Overzicht', 'Rapportage', 'Taken', 'Activiteit', 'Data invoeren'];
const BG = '#161A1F';
const CARD = { background: BG, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px' };
const INPUT = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  background: '#0D0F12', border: '1px solid rgba(255,255,255,0.1)',
  color: '#F4F4F5', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
const LABEL = { fontSize: 11, fontWeight: 600, color: '#71717A', marginBottom: 6, display: 'block' };

function fmtEur(n) { return n != null && !isNaN(n) ? '€' + Number(n).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'; }
function fmt(n)    { return n != null && !isNaN(n) ? Number(n).toLocaleString('nl-NL') : '—'; }

function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0);
  return date;
}
function toDateStr(d) { return new Date(d).toISOString().slice(0, 10); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

const PRIORITY_COLORS = { high: '#EF4444', medium: '#EAB308', low: '#22C55E' };
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

const NL_MONTHS = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const NL_DAYS   = ['zo','ma','di','wo','do','vr','za'];

function fmtShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${NL_DAYS[d.getDay()]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]}`;
}

function getISOWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function WeekSelector({ weekStart, weekEnd, onChange }) {
  const todayMonday = toDateStr(getMonday());
  const isCurrentWeek = weekStart >= todayMonday;

  function shift(weeks) {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + weeks * 7);
    onChange(toDateStr(d));
  }

  const weekNum = getISOWeek(weekStart);
  const year    = new Date(weekStart + 'T00:00:00').getFullYear();

  const btnStyle = (disabled) => ({
    width: 32, height: 32, borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: disabled ? '#3F3F46' : '#A1A1AA', flexShrink: 0, transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8,
      background: '#0D0F12', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '6px 8px',
    }}>
      <button style={btnStyle(false)} onClick={() => shift(-1)}
        onMouseEnter={e => { e.currentTarget.style.color = '#F4F4F5'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#A1A1AA'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      ><ChevronLeft size={14} /></button>

      <div style={{ flex: 1, textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#52525B', marginBottom: 1 }}>Week {weekNum} · {year}</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F5' }}>
          {fmtShort(weekStart)} — {fmtShort(weekEnd)}
        </p>
      </div>

      <button style={btnStyle(isCurrentWeek)} onClick={() => { if (!isCurrentWeek) shift(1); }}
        onMouseEnter={e => { if (!isCurrentWeek) { e.currentTarget.style.color = '#F4F4F5'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
        onMouseLeave={e => { e.currentTarget.style.color = isCurrentWeek ? '#3F3F46' : '#A1A1AA'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      ><ChevronRight size={14} /></button>
    </div>
  );
}

export default function ClientDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overzicht');

  // Manual data form
  const currentMonday = getMonday();
  const [weekStart, setWeekStart] = useState(toDateStr(currentMonday));
  const [weekEnd, setWeekEnd] = useState(toDateStr(addDays(currentMonday, 6)));
  const [dataForm, setDataForm] = useState({ meta_spend: '', meta_conversions: '', google_spend: '', google_conversions: '', organic_conversions: '', notes: '' });
  const [savingData, setSavingData] = useState(false);
  const [editingStatId, setEditingStatId] = useState(null);

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', due_date: '' });
  const [savingTask, setSavingTask] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    const { data: cData } = await supabase.from('clients').select('*').eq('slug', slug).single();
    if (!cData) { navigate('/clients'); return; }
    setClient(cData);

    const [wsRes, tRes, aRes] = await Promise.all([
      supabase.from('weekly_stats').select('*').eq('client_id', cData.id).order('week_start', { ascending: false }).limit(16),
      supabase.from('tasks').select('*').eq('client_id', cData.id).order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*').eq('client_id', cData.id).order('created_at', { ascending: false }).limit(20),
    ]);
    setWeeklyStats(wsRes.data ?? []);
    setTasks(tRes.data ?? []);
    setActivity(aRes.data ?? []);
    setLoading(false);
  }, [slug, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Recalc week end when start changes
  useEffect(() => {
    const monday = getMonday(new Date(weekStart + 'T00:00:00'));
    setWeekStart(toDateStr(monday));
    setWeekEnd(toDateStr(addDays(monday, 6)));
  }, [weekStart]);

  // Last 8 weeks for charts
  const chartData = [...weeklyStats].reverse().slice(-8).map(r => ({
    week: r.week_start.slice(5), // MM-DD
    Meta: Number(r.meta_conversions ?? 0),
    Google: Number(r.google_conversions ?? 0),
    Organisch: Number(r.organic_conversions ?? 0),
    metaSpend: Number(r.meta_spend ?? 0),
    googleSpend: Number(r.google_spend ?? 0),
  }));

  const latestStat = weeklyStats[0];
  const prevStat   = weeklyStats[1];
  function kpi(stat) {
    if (!stat) return { spend: null, conv: null, cpa: null };
    const spend = (stat.meta_spend ?? 0) + (stat.google_spend ?? 0);
    const conv  = (stat.meta_conversions ?? 0) + (stat.google_conversions ?? 0) + (stat.organic_conversions ?? 0);
    const cpa   = conv > 0 ? spend / conv : null;
    return { spend, conv, cpa };
  }
  const latest = kpi(latestStat);
  const prev   = kpi(prevStat);
  function trend(cur, old) {
    if (cur == null || old == null || old === 0) return null;
    return ((cur - old) / old) * 100;
  }

  // Data form helpers
  function handleWeekStartChange(val) {
    const monday = getMonday(new Date(val + 'T00:00:00'));
    setWeekStart(toDateStr(monday));
  }

  function duplicateLastWeek() {
    if (!weeklyStats[0]) { toast('Geen vorige week gevonden', 'info'); return; }
    const s = weeklyStats[0];
    setDataForm({
      meta_spend: s.meta_spend ?? '',
      meta_conversions: s.meta_conversions ?? '',
      google_spend: s.google_spend ?? '',
      google_conversions: s.google_conversions ?? '',
      organic_conversions: s.organic_conversions ?? '',
      notes: '',
    });
    toast('Vorige week gekopieerd', 'info');
  }

  const calcSpend = (parseFloat(dataForm.meta_spend) || 0) + (parseFloat(dataForm.google_spend) || 0);
  const calcConv  = (parseInt(dataForm.meta_conversions) || 0) + (parseInt(dataForm.google_conversions) || 0) + (parseInt(dataForm.organic_conversions) || 0);
  const calcCpa   = calcConv > 0 ? calcSpend / calcConv : null;

  async function saveData(andNew = false) {
    if (!client) return;
    setSavingData(true);
    const payload = {
      client_id: client.id,
      week_start: weekStart,
      week_end:   weekEnd,
      meta_spend: parseFloat(dataForm.meta_spend) || 0,
      meta_conversions: parseInt(dataForm.meta_conversions) || 0,
      google_spend: parseFloat(dataForm.google_spend) || 0,
      google_conversions: parseInt(dataForm.google_conversions) || 0,
      organic_conversions: parseInt(dataForm.organic_conversions) || 0,
      notes: dataForm.notes || null,
    };

    let error;
    if (editingStatId) {
      ({ error } = await supabase.from('weekly_stats').update(payload).eq('id', editingStatId));
    } else {
      ({ error } = await supabase.from('weekly_stats').upsert(payload, { onConflict: 'client_id,week_start' }));
    }

    if (error) { toast(error.message, 'error'); setSavingData(false); return; }

    await supabase.from('activity_log').insert([{ client_id: client.id, action: `Weekdata opgeslagen: ${weekStart}` }]);
    toast('Data opgeslagen', 'success');
    setEditingStatId(null);

    if (andNew) {
      const nextMonday = addDays(new Date(weekStart + 'T00:00:00'), 7);
      setWeekStart(toDateStr(nextMonday));
      setDataForm({ meta_spend: '', meta_conversions: '', google_spend: '', google_conversions: '', organic_conversions: '', notes: '' });
    }
    await fetchAll();
    setSavingData(false);
  }

  function startEdit(stat) {
    setTab('Data invoeren');
    setEditingStatId(stat.id);
    setWeekStart(stat.week_start);
    setDataForm({
      meta_spend: stat.meta_spend ?? '',
      meta_conversions: stat.meta_conversions ?? '',
      google_spend: stat.google_spend ?? '',
      google_conversions: stat.google_conversions ?? '',
      organic_conversions: stat.organic_conversions ?? '',
      notes: stat.notes ?? '',
    });
  }

  // Tasks
  async function createTask(e) {
    e.preventDefault();
    if (!client) return;
    setSavingTask(true);
    const { data, error } = await supabase.from('tasks').insert([{ ...taskForm, client_id: client.id }]).select().single();
    setSavingTask(false);
    if (error) { toast(error.message, 'error'); return; }
    setTasks(prev => [data, ...prev]);
    await supabase.from('activity_log').insert([{ client_id: client.id, action: `Taak aangemaakt: ${data.title}` }]);
    toast('Taak aangemaakt', 'success');
    setShowTaskModal(false);
    setTaskForm({ title: '', description: '', priority: 'medium', assignee: '', due_date: '' });
  }

  async function updateTaskStatus(taskId, newStatus) {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (!error) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  }

  if (loading) return (
    <AdminLayout>
      <div style={{ padding: '36px 40px', color: '#52525B', fontSize: 14 }}>Laden…</div>
    </AdminLayout>
  );

  if (!client) return null;

  return (
    <AdminLayout>
      <div style={{ padding: '36px 40px', maxWidth: 1200 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <button onClick={() => navigate('/clients')} style={{ background: 'none', border: 'none', color: '#52525B', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>← Klanten</button>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F4F4F5', marginBottom: 4 }}>{client.name}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                background: client.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(113,113,122,0.1)',
                color: client.status === 'active' ? '#22C55E' : '#71717A',
                border: `1px solid ${client.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(113,113,122,0.2)'}`,
              }}>{client.status === 'active' ? 'Actief' : 'Gepauzeerd'}</span>
              {client.cpa_target && <span style={{ fontSize: 11, color: '#52525B' }}>CPA-doel: {fmtEur(client.cpa_target)}</span>}
              {client.roas_target && <span style={{ fontSize: 11, color: '#52525B' }}>ROAS-doel: {client.roas_target}x</span>}
            </div>
          </div>
          <button
            onClick={() => navigate(`/client/${client.slug}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <ExternalLink size={14} /> Open klantdashboard
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t ? 600 : 400, fontFamily: 'inherit',
              color: tab === t ? '#F4F4F5' : '#71717A',
              borderBottom: tab === t ? '2px solid #3B82F6' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>

        {/* Tab: Overzicht */}
        {tab === 'Overzicht' && (
          <div>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Totale Spend', cur: latest.spend, old: prev.spend, fmt: fmtEur },
                { label: 'Conversies',  cur: latest.conv,  old: prev.conv,  fmt: fmt    },
                { label: 'CPA',         cur: latest.cpa,   old: prev.cpa,   fmt: fmtEur },
                { label: 'CPA-doel',    cur: client.cpa_target, old: null, fmt: fmtEur },
              ].map(({ label, cur, old, fmt: fmtFn }) => {
                const t = trend(cur, old);
                return (
                  <div key={label} style={CARD}>
                    <p style={{ fontSize: 10, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 10 }}>{label}</p>
                    <p style={{ fontSize: 26, fontWeight: 700, color: '#F4F4F5', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{fmtFn(cur)}</p>
                    {t != null && (
                      <p style={{ fontSize: 11, color: t >= 0 ? '#22C55E' : '#EF4444', marginTop: 4 }}>
                        {t >= 0 ? '↑' : '↓'} {Math.abs(t).toFixed(0)}% vs vorige week
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Chart */}
            <div style={{ ...CARD, marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#71717A', marginBottom: 16 }}>Conversies — laatste 8 weken</p>
              {chartData.length === 0 ? (
                <p style={{ fontSize: 13, color: '#52525B', textAlign: 'center', padding: '32px 0' }}>Nog geen data. Voeg weken toe via "Data invoeren".</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0D0F12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Line type="monotone" dataKey="Meta" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Google" stroke="#6C00EE" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Organisch" stroke="#22C55E" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Channel breakdown */}
            {latestStat && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Meta Ads', spend: latestStat.meta_spend, conv: latestStat.meta_conversions, color: '#3B82F6' },
                  { label: 'Google Ads', spend: latestStat.google_spend, conv: latestStat.google_conversions, color: '#6C00EE' },
                  { label: 'Organisch', spend: null, conv: latestStat.organic_conversions, color: '#22C55E' },
                ].map(({ label, spend, conv, color }) => (
                  <div key={label} style={{ ...CARD, borderTop: `3px solid ${color}` }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#71717A', marginBottom: 12 }}>{label}</p>
                    {spend != null && <p style={{ fontSize: 13, color: '#A1A1AA', marginBottom: 4 }}>Spend: <strong style={{ color: '#F4F4F5' }}>{fmtEur(spend)}</strong></p>}
                    <p style={{ fontSize: 13, color: '#A1A1AA' }}>Conversies: <strong style={{ color: '#F4F4F5' }}>{fmt(conv)}</strong></p>
                    {spend != null && conv > 0 && <p style={{ fontSize: 13, color: '#A1A1AA', marginTop: 4 }}>CPA: <strong style={{ color: '#F4F4F5' }}>{fmtEur(spend / conv)}</strong></p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Rapportage */}
        {tab === 'Rapportage' && (
          <div>
            <div style={{ ...CARD, marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#71717A', marginBottom: 16 }}>Ad Spend per kanaal — laatste 8 weken</p>
              {chartData.length === 0 ? (
                <p style={{ fontSize: 13, color: '#52525B', textAlign: 'center', padding: '32px 0' }}>Nog geen data beschikbaar.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0D0F12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="metaSpend" name="Meta Spend" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="googleSpend" name="Google Spend" fill="#6C00EE" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div style={{ ...CARD }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#71717A', marginBottom: 16 }}>Conversies per kanaal — laatste 8 weken</p>
              {chartData.length === 0 ? (
                <p style={{ fontSize: 13, color: '#52525B', textAlign: 'center', padding: '32px 0' }}>Nog geen data beschikbaar.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0D0F12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="Meta" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Google" fill="#6C00EE" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Organisch" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Tab: Taken */}
        {tab === 'Taken' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={() => setShowTaskModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              }}>
                <Plus size={14} /> Nieuwe taak
              </button>
            </div>
            {tasks.length === 0 ? (
              <div style={{ ...CARD, textAlign: 'center', padding: '40px 24px' }}>
                <p style={{ fontSize: 13, color: '#52525B' }}>Nog geen taken voor deze klant.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.map(task => (
                  <div key={task.id} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F5', marginBottom: 2 }}>{task.title}</p>
                      {task.description && <p style={{ fontSize: 12, color: '#71717A' }}>{task.description}</p>}
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <span style={{ fontSize: 11, color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
                        {task.assignee && <span style={{ fontSize: 11, color: '#52525B' }}>@ {task.assignee}</span>}
                        {task.due_date && <span style={{ fontSize: 11, color: '#52525B' }}>{task.due_date}</span>}
                      </div>
                    </div>
                    <select
                      value={task.status}
                      onChange={e => updateTaskStatus(task.id, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      style={{ ...INPUT, width: 'auto', fontSize: 11, padding: '4px 8px' }}
                    >
                      {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Activiteit */}
        {tab === 'Activiteit' && (
          <div style={CARD}>
            {activity.length === 0 ? (
              <p style={{ fontSize: 13, color: '#52525B', textAlign: 'center', padding: '16px 0' }}>Nog geen activiteit geregistreerd.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {activity.map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', gap: 12, paddingBottom: i < activity.length - 1 ? 16 : 0, marginBottom: i < activity.length - 1 ? 16 : 0, borderBottom: i < activity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', marginTop: 4, flexShrink: 0 }} />
                      {i < activity.length - 1 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.06)', marginTop: 4 }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 4 }}>
                      <p style={{ fontSize: 13, color: '#F4F4F5' }}>{a.action}</p>
                      {a.detail && <p style={{ fontSize: 12, color: '#71717A', marginTop: 2 }}>{a.detail}</p>}
                      <p style={{ fontSize: 11, color: '#3F3F46', marginTop: 4 }}>
                        {new Date(a.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Data invoeren */}
        {tab === 'Data invoeren' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', gap: 24 }}>
              {/* Form */}
              <div style={CARD}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#F4F4F5' }}>{editingStatId ? 'Bewerken' : 'Nieuwe week invoeren'}</p>
                  <button
                    onClick={duplicateLastWeek}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: '#A1A1AA', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <Copy size={12} /> Dupliceer vorige week
                  </button>
                </div>

                {/* Week selector */}
                <div style={{ marginBottom: 16 }}>
                  <label style={LABEL}>Week</label>
                  <WeekSelector
                    weekStart={weekStart}
                    weekEnd={weekEnd}
                    onChange={handleWeekStartChange}
                  />
                </div>

                {/* Meta */}
                <p style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Meta Ads</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div>
                    <label style={LABEL}>Spend (€)</label>
                    <input type="number" step="0.01" style={INPUT} value={dataForm.meta_spend} placeholder="0.00"
                      onChange={e => setDataForm(f => ({ ...f, meta_spend: e.target.value }))} />
                  </div>
                  <div>
                    <label style={LABEL}>Conversies</label>
                    <input type="number" style={INPUT} value={dataForm.meta_conversions} placeholder="0"
                      onChange={e => setDataForm(f => ({ ...f, meta_conversions: e.target.value }))} />
                  </div>
                </div>

                {/* Google */}
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6C00EE', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Google Ads</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div>
                    <label style={LABEL}>Spend (€)</label>
                    <input type="number" step="0.01" style={INPUT} value={dataForm.google_spend} placeholder="0.00"
                      onChange={e => setDataForm(f => ({ ...f, google_spend: e.target.value }))} />
                  </div>
                  <div>
                    <label style={LABEL}>Conversies</label>
                    <input type="number" style={INPUT} value={dataForm.google_conversions} placeholder="0"
                      onChange={e => setDataForm(f => ({ ...f, google_conversions: e.target.value }))} />
                  </div>
                </div>

                {/* Organic */}
                <p style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Organisch</p>
                <div style={{ marginBottom: 16 }}>
                  <label style={LABEL}>Conversies</label>
                  <input type="number" style={INPUT} value={dataForm.organic_conversions} placeholder="0"
                    onChange={e => setDataForm(f => ({ ...f, organic_conversions: e.target.value }))} />
                </div>

                {/* Auto-calculated */}
                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: '#52525B', marginBottom: 8, fontWeight: 600 }}>Auto-berekend</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    <div><p style={{ fontSize: 10, color: '#52525B' }}>Totaal spend</p><p style={{ fontSize: 14, fontWeight: 700, color: '#F4F4F5' }}>{fmtEur(calcSpend)}</p></div>
                    <div><p style={{ fontSize: 10, color: '#52525B' }}>Totaal conv.</p><p style={{ fontSize: 14, fontWeight: 700, color: '#F4F4F5' }}>{fmt(calcConv)}</p></div>
                    <div><p style={{ fontSize: 10, color: '#52525B' }}>CPA</p><p style={{ fontSize: 14, fontWeight: 700, color: '#F4F4F5' }}>{calcCpa != null ? fmtEur(calcCpa) : '—'}</p></div>
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 20 }}>
                  <label style={LABEL}>Notities</label>
                  <textarea style={{ ...INPUT, height: 72, resize: 'vertical' }} value={dataForm.notes} placeholder="Optionele notities voor deze week…"
                    onChange={e => setDataForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                {/* Save buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => saveData(false)}
                    disabled={savingData}
                    style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: savingData ? 0.7 : 1 }}
                  >
                    {savingData ? 'Bezig…' : 'Opslaan'}
                  </button>
                  {!editingStatId && (
                    <button
                      onClick={() => saveData(true)}
                      disabled={savingData}
                      style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#F4F4F5', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Opslaan & nieuwe week
                    </button>
                  )}
                  {editingStatId && (
                    <button onClick={() => { setEditingStatId(null); setDataForm({ meta_spend: '', meta_conversions: '', google_spend: '', google_conversions: '', organic_conversions: '', notes: '' }); }}
                      style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#71717A', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Annuleren
                    </button>
                  )}
                </div>
              </div>

              {/* History table */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Ingevoerde weken</p>
                <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
                  {weeklyStats.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#52525B', textAlign: 'center', padding: '32px 16px' }}>Nog geen data ingevoerd voor deze klant.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {['Week', 'Meta spend', 'Google spend', 'Conv.', 'CPA', ''].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: '#52525B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyStats.map((s, i) => {
                          const spend = (s.meta_spend ?? 0) + (s.google_spend ?? 0);
                          const conv  = (s.meta_conversions ?? 0) + (s.google_conversions ?? 0) + (s.organic_conversions ?? 0);
                          const cpa   = conv > 0 ? spend / conv : null;
                          return (
                            <tr key={s.id} style={{ borderBottom: i < weeklyStats.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                              <td style={{ padding: '11px 14px', fontSize: 12, color: '#F4F4F5', fontWeight: 600 }}>{s.week_start}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12, color: '#A1A1AA' }}>{fmtEur(s.meta_spend)}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12, color: '#A1A1AA' }}>{fmtEur(s.google_spend)}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12, color: '#A1A1AA' }}>{fmt(conv)}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12, color: '#A1A1AA' }}>{cpa != null ? fmtEur(cpa) : '—'}</td>
                              <td style={{ padding: '11px 14px' }}>
                                <button onClick={() => startEdit(s)} style={{ fontSize: 11, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Bewerk</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task modal */}
      {showTaskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={() => setShowTaskModal(false)}>
          <div style={{ background: '#161A1F', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: 32, width: 440, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F4F4F5' }}>Nieuwe taak</h2>
              <button onClick={() => setShowTaskModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717A' }}><X size={18} /></button>
            </div>
            <form onSubmit={createTask}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={LABEL}>Titel *</label><input required style={INPUT} value={taskForm.title} placeholder="Taaktitel" onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><label style={LABEL}>Omschrijving</label><textarea style={{ ...INPUT, height: 72, resize: 'vertical' }} value={taskForm.description} placeholder="Optionele beschrijving" onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={LABEL}>Prioriteit</label>
                    <select style={INPUT} value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="high">Hoog</option>
                      <option value="medium">Gemiddeld</option>
                      <option value="low">Laag</option>
                    </select>
                  </div>
                  <div><label style={LABEL}>Verantwoordelijke</label><input style={INPUT} value={taskForm.assignee} placeholder="Naam" onChange={e => setTaskForm(f => ({ ...f, assignee: e.target.value }))} /></div>
                </div>
                <div><label style={LABEL}>Deadline</label><input type="date" style={INPUT} value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" onClick={() => setShowTaskModal(false)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#71717A', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annuleren</button>
                <button type="submit" disabled={savingTask} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: savingTask ? 0.7 : 1 }}>
                  {savingTask ? 'Bezig…' : 'Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

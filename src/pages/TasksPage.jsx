import { useState, useEffect } from 'react';
import { Plus, X, List, LayoutGrid } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useIsMobile } from '../hooks/useIsMobile';

const COLUMNS = [
  { key: 'todo',        label: 'To Do',       color: '#52525B' },
  { key: 'in_progress', label: 'In Progress',  color: '#3B82F6' },
  { key: 'review',      label: 'Review',       color: '#EAB308' },
  { key: 'done',        label: 'Done',         color: '#22C55E' },
];
const PRIORITY_COLORS = { high: '#EF4444', medium: '#EAB308', low: '#22C55E' };
const PRIORITY_LABELS = { high: 'Hoog', medium: 'Gemiddeld', low: 'Laag' };

const INPUT = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  background: '#0D0F12', border: '1px solid rgba(255,255,255,0.1)',
  color: '#F4F4F5', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
const LABEL = { fontSize: 11, fontWeight: 600, color: '#71717A', marginBottom: 6, display: 'block' };

export default function TasksPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [tasks, setTasks]     = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState('kanban'); // 'kanban' | 'list'
  const [showModal, setShowModal] = useState(false);
  const [filterClient, setFilterClient]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', client_id: '', priority: 'medium', assignee: '', due_date: '', status: 'todo' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [tRes, cRes] = await Promise.all([
      supabase.from('tasks').select('*, clients(name, slug)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').order('name'),
    ]);
    setTasks(tRes.data ?? []);
    setClients(cRes.data ?? []);
    setLoading(false);
  }

  async function createTask(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || null,
      client_id: taskForm.client_id || null,
      priority: taskForm.priority,
      assignee: taskForm.assignee.trim() || null,
      due_date: taskForm.due_date || null,
      status: taskForm.status,
    };
    const { data, error } = await supabase.from('tasks').insert([payload]).select('*, clients(name, slug)').single();
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    setTasks(prev => [data, ...prev]);
    if (data.client_id) {
      await supabase.from('activity_log').insert([{ client_id: data.client_id, action: `Taak aangemaakt: ${data.title}` }]);
    }
    toast('Taak aangemaakt', 'success');
    setShowModal(false);
    setTaskForm({ title: '', description: '', client_id: '', priority: 'medium', assignee: '', due_date: '', status: 'todo' });
  }

  async function moveTask(taskId, newStatus) {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (!error) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  }

  async function deleteTask(taskId) {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (!error) { setTasks(prev => prev.filter(t => t.id !== taskId)); toast('Taak verwijderd', 'success'); }
  }

  const filtered = tasks.filter(t => {
    if (filterClient && t.client_id !== filterClient) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#F4F4F5', marginBottom: 4 }}>Taken</h1>
            <p style={{ fontSize: 13, color: '#71717A' }}>{tasks.length} taken in totaal</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filters */}
            <select style={{ ...INPUT, width: 'auto', fontSize: 12, padding: '7px 10px' }} value={filterClient} onChange={e => setFilterClient(e.target.value)}>
              <option value="">Alle klanten</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select style={{ ...INPUT, width: 'auto', fontSize: 12, padding: '7px 10px' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">Alle prioriteiten</option>
              <option value="high">Hoog</option>
              <option value="medium">Gemiddeld</option>
              <option value="low">Laag</option>
            </select>

            {/* View toggle */}
            <div style={{ display: 'flex', gap: 2, background: '#161A1F', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
              {[['kanban', LayoutGrid], ['list', List]].map(([v, Icon]) => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: '5px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: view === v ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: view === v ? '#F4F4F5' : '#71717A', display: 'flex', alignItems: 'center',
                }}><Icon size={14} /></button>
              ))}
            </div>

            <button onClick={() => setShowModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8,
              border: 'none', cursor: 'pointer', background: '#3B82F6', color: '#fff',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            }}>
              <Plus size={14} /> Nieuwe taak
            </button>
          </div>
        </div>

        {/* Kanban view */}
        {view === 'kanban' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(4, 280px)' : 'repeat(4, 1fr)', gap: 16, alignItems: 'start', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? 8 : 0 }}>
            {COLUMNS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.key);
              return (
                <div key={col.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#A1A1AA' }}>{col.label}</p>
                    <span style={{ fontSize: 11, color: '#52525B', marginLeft: 'auto' }}>{colTasks.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {colTasks.map(task => (
                      <TaskCard key={task.id} task={task} columns={COLUMNS} onMove={moveTask} onDelete={deleteTask} />
                    ))}
                    {colTasks.length === 0 && (
                      <div style={{
                        padding: '20px 12px', borderRadius: 10, textAlign: 'center',
                        border: '1px dashed rgba(255,255,255,0.07)', fontSize: 12, color: '#3F3F46',
                      }}>Leeg</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List view */}
        {view === 'list' && (
          <div style={{ background: '#161A1F', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Taak', 'Klant', 'Status', 'Prioriteit', 'Verantwoordelijke', 'Deadline', ''].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, color: '#52525B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((task, i) => (
                  <tr key={task.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#F4F4F5' }}>{task.title}</p>
                      {task.description && <p style={{ fontSize: 11, color: '#71717A', marginTop: 2 }}>{task.description}</p>}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: '#71717A' }}>{task.clients?.name ?? '—'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <select
                        value={task.status}
                        onChange={e => moveTask(task.id, e.target.value)}
                        style={{ ...INPUT, width: 'auto', fontSize: 11, padding: '4px 8px' }}
                      >
                        {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLORS[task.priority] }}>{PRIORITY_LABELS[task.priority]}</span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: '#A1A1AA' }}>{task.assignee ?? '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: '#A1A1AA' }}>{task.due_date ?? '—'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525B' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#52525B'}
                      ><X size={14} /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: '#52525B' }}>
                    {tasks.length === 0 ? 'Nog geen taken aangemaakt.' : 'Geen taken gevonden.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: '#161A1F', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: 32, width: 480, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F4F4F5' }}>Nieuwe taak</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717A' }}><X size={18} /></button>
            </div>
            <form onSubmit={createTask}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={LABEL}>Titel *</label><input required style={INPUT} value={taskForm.title} placeholder="Taaktitel" onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><label style={LABEL}>Omschrijving</label><textarea style={{ ...INPUT, height: 72, resize: 'vertical' }} value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div>
                  <label style={LABEL}>Klant</label>
                  <select style={INPUT} value={taskForm.client_id} onChange={e => setTaskForm(f => ({ ...f, client_id: e.target.value }))}>
                    <option value="">Geen specifieke klant</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={LABEL}>Prioriteit</label>
                    <select style={INPUT} value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="high">Hoog</option>
                      <option value="medium">Gemiddeld</option>
                      <option value="low">Laag</option>
                    </select>
                  </div>
                  <div>
                    <label style={LABEL}>Status</label>
                    <select style={INPUT} value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}>
                      {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                  <div><label style={LABEL}>Verantwoordelijke</label><input style={INPUT} value={taskForm.assignee} placeholder="Naam" onChange={e => setTaskForm(f => ({ ...f, assignee: e.target.value }))} /></div>
                </div>
                <div><label style={LABEL}>Deadline</label><input type="date" style={INPUT} value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#71717A', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annuleren</button>
                <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Bezig…' : 'Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function TaskCard({ task, columns, onMove, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: '#161A1F', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
      padding: '12px 14px', transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#F4F4F5', lineHeight: 1.4 }}>{task.title}</p>
          {task.clients?.name && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, marginTop: 6, display: 'inline-block',
              background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)',
            }}>{task.clients.name}</span>
          )}
        </div>
        <button onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3F3F46', padding: 2, flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
          onMouseLeave={e => e.currentTarget.style.color = '#3F3F46'}
        ><X size={12} /></button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: PRIORITY_COLORS[task.priority] }}>{PRIORITY_LABELS[task.priority]}</span>
        {task.assignee && <span style={{ fontSize: 10, color: '#52525B' }}>@ {task.assignee}</span>}
        {task.due_date && <span style={{ fontSize: 10, color: '#52525B', marginLeft: 'auto' }}>{task.due_date}</span>}
      </div>

      {/* Move to column */}
      <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {columns.filter(c => c.key !== task.status).map(c => (
          <button key={c.key} onClick={() => onMove(task.id, c.key)} style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 4,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#52525B', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c.color + '44'; e.currentTarget.style.color = c.color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#52525B'; }}
          >→ {c.label}</button>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Shield, User, Clock, CheckSquare, AlertCircle, Loader, Mail, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../hooks/useIsMobile';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpbXdxY3FheW5qcnBlcGtmandoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU5MTU3MiwiZXhwIjoyMDkxMTY3NTcyfQ.GDLpZmiZ8042ErELwA8f7ppKl9X8t2WzP_1U18lNdV0';

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: Crown,  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  admin: { label: 'Admin', icon: Shield, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)' },
  client:{ label: 'Klant', icon: User,   color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'  },
};

const STATUS_COLOR = { todo: '#52525B', in_progress: '#3B82F6', review: '#F59E0B', done: '#22C55E' };
const STATUS_LABEL = { todo: 'Te doen', in_progress: 'Bezig', review: 'Review', done: 'Klaar' };
const PRIORITY_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' };

function timeAgo(ts) {
  if (!ts) return 'Nooit ingelogd';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2)   return 'Zojuist';
  if (m < 60)  return `${m} min geleden`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} uur geleden`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Gisteren';
  if (d < 7)   return `${d} dagen geleden`;
  return new Date(ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function initials(email) {
  return (email ?? '?').split('@')[0].slice(0, 2).toUpperCase();
}

function MemberCard({ member, tasks, clients, isMobile }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const rc = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.admin;
  const RoleIcon = rc.icon;

  const myTasks = tasks.filter(t => t.assignee === member.email);
  const openTasks = myTasks.filter(t => t.status !== 'done');
  const doneTasks = myTasks.filter(t => t.status === 'done');

  const statusCounts = { todo: 0, in_progress: 0, review: 0, done: 0 };
  myTasks.forEach(t => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; });

  const myClientIds = [...new Set(myTasks.map(t => t.client_id).filter(Boolean))];
  const myClients = clients.filter(c => myClientIds.includes(c.id));

  const totalTasks = myTasks.length;
  const pct = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  return (
    <div style={{
      background: '#161A1F', borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden', transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
    >
      {/* Main row */}
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: rc.bg, border: `1px solid ${rc.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: rc.color,
        }}>
          {initials(member.email)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#F4F4F5' }}>{member.email}</p>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
              background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              <RoleIcon size={9} />
              {rc.label}
            </span>
          </div>
          <div style={{ display: 'flex', align: 'center', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#52525B', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={10} /> {timeAgo(member.last_sign_in_at)}
            </span>
            {myClients.length > 0 && (
              <span style={{ fontSize: 11, color: '#52525B' }}>
                {myClients.map(c => c.name).join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Task stats */}
        <div style={{ display: isMobile ? 'none' : 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
          {[
            { status: 'in_progress', count: statusCounts.in_progress },
            { status: 'review',      count: statusCounts.review },
            { status: 'todo',        count: statusCounts.todo },
          ].map(({ status, count }) => (
            <div key={status} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: count > 0 ? STATUS_COLOR[status] : '#3F3F46' }}>{count}</p>
              <p style={{ fontSize: 9, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{STATUS_LABEL[status]}</p>
            </div>
          ))}
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#22C55E' }}>{doneTasks.length}</p>
            <p style={{ fontSize: 9, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Klaar</p>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#71717A',
            display: 'flex', alignItems: 'center',
          }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div style={{ padding: '0 24px 4px' }}>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#22C55E', transition: 'width 0.3s', borderRadius: 2 }} />
          </div>
        </div>
      )}

      {/* Expanded: task list */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px' }}>
          {myTasks.length === 0 ? (
            <p style={{ fontSize: 12, color: '#52525B', fontStyle: 'italic' }}>Geen taken toegewezen</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Taken ({myTasks.length})
              </p>
              {myTasks.map(task => {
                const client = clients.find(c => c.id === task.client_id);
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/clients/${client?.slug ?? ''}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                      cursor: client ? 'pointer' : 'default', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (client) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLOR[task.priority] ?? '#52525B', flexShrink: 0 }} />
                    <p style={{ flex: 1, fontSize: 12, color: task.status === 'done' ? '#52525B' : '#F4F4F5', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>{task.title}</p>
                    {client && <span style={{ fontSize: 10, color: '#52525B', whiteSpace: 'nowrap' }}>{client.name}</span>}
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                      background: `${STATUS_COLOR[task.status]}18`, color: STATUS_COLOR[task.status],
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {STATUS_LABEL[task.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {myClients.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Verbonden klanten
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {myClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.slug}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 6,
                      background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
                      color: '#3B82F6', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <ExternalLink size={10} /> {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  const isMobile = useIsMobile();
  const [members, setMembers]   = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [profilesRes, tasksRes, clientsRes, authRes] = await Promise.all([
      supabase.from('profiles').select('*').in('role', ['owner', 'admin']),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('name'),
      fetch('https://fimwqcqaynjrpepkfjwh.supabase.co/auth/v1/admin/users?per_page=100', {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
      }).then(r => r.json()).catch(() => ({ users: [] })),
    ]);

    const profiles = profilesRes.data ?? [];
    const authUsers = authRes.users ?? [];

    // Merge auth data into profiles
    const merged = profiles.map(p => {
      const au = authUsers.find(u => u.id === p.id);
      return { ...p, last_sign_in_at: au?.last_sign_in_at ?? null, confirmed_at: au?.confirmed_at ?? null };
    }).sort((a, b) => {
      const order = { owner: 0, admin: 1 };
      return (order[a.role] ?? 2) - (order[b.role] ?? 2);
    });

    setMembers(merged);
    setTasks(tasksRes.data ?? []);
    setClients(clientsRes.data ?? []);
    setLoading(false);
  }

  const openTasks  = tasks.filter(t => t.status !== 'done').length;
  const doneTasks  = tasks.filter(t => t.status === 'done').length;
  const highPrio   = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? '20px 16px' : '36px 40px', maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#F4F4F5', marginBottom: 4 }}>Team</h1>
          <p style={{ fontSize: 13, color: '#71717A' }}>Overzicht van alle teamleden, taken en klantverbindingen</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 14, marginBottom: 24 }}>
          {[
            { label: 'Teamleden',     value: members.length, color: '#3B82F6', sub: `${members.filter(m => m.role === 'owner').length} owner, ${members.filter(m => m.role === 'admin').length} admins` },
            { label: 'Open taken',    value: openTasks,      color: '#F59E0B', sub: `${highPrio} hoge prioriteit` },
            { label: 'Afgerond',      value: doneTasks,      color: '#22C55E', sub: 'van alle taken' },
            { label: 'Klanten',       value: clients.length, color: '#8B5CF6', sub: `${clients.filter(c => c.status === 'active').length} actief` },
          ].map(({ label, value, color, sub }) => (
            <div key={label} style={{
              background: '#161A1F', borderRadius: 12, padding: '18px 20px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <p style={{ fontSize: 11, color: '#52525B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 11, color: '#52525B', marginTop: 6 }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Member cards */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader size={24} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {members.map(m => (
              <MemberCard key={m.id} member={m} tasks={tasks} clients={clients} isMobile={isMobile} />
            ))}
            {members.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: '#52525B', fontSize: 13 }}>
                Geen teamleden gevonden.
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

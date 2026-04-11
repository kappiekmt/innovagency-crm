import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, Settings, LogOut, Zap, UsersRound, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients',   icon: Users,           label: 'Klanten'   },
  { to: '/tasks',     icon: CheckSquare,     label: 'Taken'     },
  { to: '/team',      icon: UsersRound,      label: 'Team'      },
  { to: '/settings',  icon: Settings,        label: 'Instellingen' },
];

const navLinkStyle = (isActive) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 10px', borderRadius: 8, marginBottom: 2,
  textDecoration: 'none', fontSize: 13,
  fontWeight: isActive ? 600 : 400,
  color: isActive ? '#F4F4F5' : '#71717A',
  background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
  borderLeft: isActive ? '2px solid #3B82F6' : '2px solid transparent',
  transition: 'all 0.15s',
});

export default function AdminLayout({ children }) {
  const { signOut, supaSession } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const email    = supaSession?.user?.email ?? '';
  const initials = email ? email.slice(0, 2).toUpperCase() : '?';

  function handleLogout() { signOut(); navigate('/login'); }
  function closeDrawer()  { setDrawerOpen(false); }

  const SidebarContents = () => (
    <>
      {/* Brand */}
      <div style={{ padding: '20px 16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={15} color="#3B82F6" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#F4F4F5', lineHeight: 1.2 }}>Innovagency</p>
            <p style={{ fontSize: 10, color: '#3F3F46', marginTop: 1 }}>Admin Centre</p>
          </div>
        </div>
        {isMobile && (
          <button onClick={closeDrawer} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717A', display: 'flex', padding: 4 }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#3F3F46', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 8px 6px' }}>Menu</p>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/clients' ? false : true}
            onClick={closeDrawer}
            style={({ isActive }) => navLinkStyle(isActive)}
            onMouseEnter={e => { if (!e.currentTarget.style.background.includes('59,130,246')) { e.currentTarget.style.color = '#A1A1AA'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } }}
            onMouseLeave={e => { if (!e.currentTarget.style.background.includes('59,130,246')) { e.currentTarget.style.color = '#71717A'; e.currentTarget.style.background = 'transparent'; } }}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <NavLink
          to="/profile"
          onClick={closeDrawer}
          style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 2, textDecoration: 'none', background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent', borderLeft: isActive ? '2px solid #3B82F6' : '2px solid transparent', transition: 'all 0.15s' })}
          onMouseEnter={e => { if (!e.currentTarget.style.background.includes('59,130,246')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { if (!e.currentTarget.style.background.includes('59,130,246')) e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#3B82F6' }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#F4F4F5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</p>
            <p style={{ fontSize: 10, color: '#52525B', marginTop: 1 }}>Mijn profiel</p>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#52525B', fontFamily: 'inherit', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#52525B'; e.currentTarget.style.background = 'none'; }}
        >
          <LogOut size={14} />
          Uitloggen
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0F12' }}>
        {/* Top bar */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 56,
          background: '#0A0C10', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={13} color="#3B82F6" />
            </div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#F4F4F5' }}>Innovagency</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#A1A1AA', display: 'flex' }}
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Backdrop */}
        {drawerOpen && (
          <div
            onClick={closeDrawer}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 28, backdropFilter: 'blur(3px)' }}
          />
        )}

        {/* Drawer */}
        <aside style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', width: 260,
          background: '#0A0C10', borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', zIndex: 29,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <SidebarContents />
        </aside>

        {/* Content */}
        <main style={{ paddingTop: 56, minHeight: '100vh' }}>
          {children}
        </main>
      </div>
    );
  }

  // Desktop
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0F12' }}>
      <aside style={{ width: 232, flexShrink: 0, background: '#0A0C10', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 20 }}>
        <SidebarContents />
      </aside>
      <main style={{ flex: 1, marginLeft: 232, minHeight: '100vh', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

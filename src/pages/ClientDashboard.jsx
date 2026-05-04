import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDashboardData } from '../hooks/useDashboardData';
import { useMoMData } from '../hooks/useMoMData';
import { useClientStats } from '../hooks/useClientStats';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import KPICards from '../components/KPICards';
import PlatformCards from '../components/PlatformCards';
import InsightsPanel from '../components/InsightsPanel';
import TrendChart from '../components/TrendChart';
import BudgetDonut from '../components/BudgetDonut';
import Footer from '../components/Footer';
import MetaAdsTab from '../components/meta-ads/MetaAdsTab';

const PALETTE = ['#6C00EE', '#3B82F6', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function deriveColor(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function deriveInitials(name) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function Skeleton({ height = 120, delay = 0 }) {
  return (
    <div
      style={{
        height,
        borderRadius: 14,
        background: 'linear-gradient(90deg, #111318 25%, #1a1d24 50%, #111318 75%)',
        backgroundSize: '200% 100%',
        animation: `shimmer 1.4s infinite ${delay}ms`,
      }}
    />
  );
}

const shimmerStyle = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0c10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#3B82F6', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ClientDashboard() {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }
    // Support both slug-based URLs (admins) and UUID-based URLs (client users)
    const query = UUID_RE.test(clientId)
      ? supabase.from('clients').select('*').eq('id', clientId).single()
      : supabase.from('clients').select('*').eq('slug', clientId).single();

    query.then(({ data }) => {
      if (data) {
        setClient({
          ...data,
          color: deriveColor(data.slug),
          initials: deriveInitials(data.name),
        });
      }
      setLoading(false);
    });
  }, [clientId]);

  if (loading) return <Spinner />;
  if (!client) return <Navigate to="/" replace />;

  return <ClientDashboardInner client={client} />;
}

function ClientDashboardInner({ client }) {
  const { data: apiData, isLoading: apiLoading, isError, isMock, lastUpdated, refetch: apiRefetch } = useDashboardData(client.slug);
  const { momData: apiMomData } = useMoMData(client.slug);
  const { data: supaData, momData: supaMomData, loading: supaLoading, hasData, refetch: supaRefetch } = useClientStats(client.slug);
  const [period, setPeriod] = useState('Maand');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Add a client slug here to enable the Meta Ads video performance tab for them.
  const META_ADS_ENABLED_SLUGS = ['zitcomfort'];
  const hasMetaAds = META_ADS_ENABLED_SLUGS.includes(client.slug);
  const { session } = useAuth();
  const navigate = useNavigate();
  const isAdmin = session?.role === 'admin' || session?.role === 'owner';
  // Client-role users only see the Meta Ads tab — the Overzicht tab pulls
  // mock multi-platform data that confuses non-marketers.
  const isClientUser = ['client', 'client_admin', 'client_member'].includes(session?.role);
  const showOverview = !isClientUser;
  const [activeTab, setActiveTab] = useState(() => (showOverview ? 'overview' : 'meta-ads'));
  const isMobile = useIsMobile();

  // Use Supabase manually-entered data when available, fall back to API data
  const data = hasData ? supaData : apiData;
  const momData = hasData ? supaMomData : apiMomData;
  const isLoading = hasData ? supaLoading : apiLoading;
  const refetch = hasData ? supaRefetch : apiRefetch;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a0c10' }}>
      {/* Admin view banner */}
      {isAdmin && (
        <div style={{
          background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)',
          padding: '9px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 50, flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: '#93C5FD', fontWeight: 500 }}>
            👁 Je bekijkt dit als: <strong>{client.name}</strong>
          </span>
          <button
            onClick={() => navigate(`/clients/${client.slug}`)}
            style={{
              fontSize: 12, color: '#3B82F6', background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6,
              padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
            }}
          >
            ← Terug naar Admin
          </button>
        </div>
      )}
    <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
      <style>{shimmerStyle}</style>
      <Sidebar client={client} isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Header
          lastUpdated={lastUpdated}
          onRefetch={refetch}
          isLoading={isLoading}
          period={period}
          onPeriodChange={setPeriod}
          clientName={client.name}
          clientColor={client.color}
          isMobile={isMobile}
          onMenuOpen={() => setSidebarOpen(true)}
        />

        {isMock && !hasData && !isLoading && (
          <div style={{
            background: 'rgba(249,115,22,0.08)',
            borderBottom: '1px solid rgba(249,115,22,0.20)',
            padding: '8px 32px',
            fontSize: 12, color: '#6C00EE', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>⚠️</span>
            Demo data — koppel je API-credentials om live data te laden
          </div>
        )}

        {isError && (
          <div style={{
            margin: '32px', padding: '24px', borderRadius: 14,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
            textAlign: 'center',
          }}>
            <p style={{ fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>Kan gegevens niet laden</p>
            <p style={{ color: '#71717a', fontSize: 13, marginBottom: 16 }}>
              Controleer je internetverbinding en API-instellingen.
            </p>
            <button
              onClick={refetch}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: client.color, color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Opnieuw proberen
            </button>
          </div>
        )}

        {hasMetaAds && showOverview && (
          <div style={{
            display: 'flex', gap: 4,
            padding: isMobile ? '0 12px' : '0 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: '#0d0f14',
          }}>
            {[
              { id: 'overview', label: 'Overzicht' },
              { id: 'meta-ads', label: 'Meta Ads' },
            ].map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: isMobile ? '11px 14px' : '13px 18px',
                    background: 'transparent', border: 'none',
                    borderBottom: `2px solid ${active ? client.color : 'transparent'}`,
                    color: active ? '#f4f4f5' : '#71717a',
                    fontSize: isMobile ? 12 : 13,
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                    marginBottom: -1,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        <main style={{ flex: 1, padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>
          {activeTab === 'meta-ads' && hasMetaAds ? (
            <MetaAdsTab client={client} />
          ) : isLoading ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16 }}>
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={120} delay={i * 80} />)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 10 : 16 }}>
                {[0, 1, 2].map((i) => <Skeleton key={i} height={160} delay={i * 80 + 200} />)}
              </div>
              <Skeleton height={80} delay={400} />
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <Skeleton height={280} delay={500} />
                <Skeleton height={280} delay={580} />
              </div>
            </>
          ) : data ? (
            <>
              <KPICards data={data} clientColor={client.color} momData={momData} />
              <PlatformCards data={data} />
              <InsightsPanel data={data} clientColor={client.color} />
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: 16, alignItems: 'flex-start' }}>
                <TrendChart data={data} />
                <BudgetDonut data={data} />
              </div>
            </>
          ) : null}
        </main>

        <Footer />
      </div>
    </div>
    </div>
  );
}

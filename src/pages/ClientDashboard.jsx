import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getClient } from '../config/clients';
import { useDashboardData } from '../hooks/useDashboardData';
import { useMoMData } from '../hooks/useMoMData';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import KPICards from '../components/KPICards';
import PlatformCards from '../components/PlatformCards';
import InsightsPanel from '../components/InsightsPanel';
import TrendChart from '../components/TrendChart';
import BudgetDonut from '../components/BudgetDonut';
import Footer from '../components/Footer';

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

export default function ClientDashboard() {
  const { clientId } = useParams();
  const client = getClient(clientId);

  if (!client) return <Navigate to="/" replace />;

  return <ClientDashboardInner client={client} />;
}

function ClientDashboardInner({ client }) {
  const { data, isLoading, isError, isMock, lastUpdated, refetch } = useDashboardData(client.id);
  const { momData } = useMoMData(client.id);
  const [period, setPeriod] = useState('Maand');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0c10' }}>
      <style>{shimmerStyle}</style>
      <Sidebar client={client} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          lastUpdated={lastUpdated}
          onRefetch={refetch}
          isLoading={isLoading}
          period={period}
          onPeriodChange={setPeriod}
          clientName={client.name}
          clientColor={client.color}
        />

        {isMock && !isLoading && (
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

        <main style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isLoading ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={120} delay={i * 80} />)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[0, 1, 2].map((i) => <Skeleton key={i} height={160} delay={i * 80 + 200} />)}
              </div>
              <Skeleton height={80} delay={400} />
              <div style={{ display: 'flex', gap: 16 }}>
                <Skeleton height={280} delay={500} />
                <Skeleton height={280} delay={580} />
              </div>
            </>
          ) : data ? (
            <>
              <KPICards data={data} clientColor={client.color} momData={momData} />
              <PlatformCards data={data} />
              <InsightsPanel data={data} clientColor={client.color} />
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <TrendChart data={data} />
                <BudgetDonut data={data} />
              </div>
            </>
          ) : null}
        </main>

        <Footer />
      </div>
    </div>
  );
}

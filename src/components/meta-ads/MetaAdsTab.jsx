import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useMetaVideoAds } from '../../hooks/useMetaVideoAds';
import { useIsMobile } from '../../hooks/useIsMobile';
import MetaDateRangePicker from './MetaDateRangePicker';
import { PRESETS } from './datePresets';
import MetaSummaryCards from './MetaSummaryCards';
import MetaSpendChart from './MetaSpendChart';
import VideoAdsTable from './VideoAdsTable';
import AdPreviewModal from './AdPreviewModal';
import MetaInsightsCallouts from './MetaInsightsCallouts';
import AgencyNotesPanel from './AgencyNotesPanel';

function Skeleton({ h }) {
  return <div style={{
    height: h, borderRadius: 14,
    background: 'linear-gradient(90deg, #111318 25%, #1a1d24 50%, #111318 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
  }} />;
}

export default function MetaAdsTab({ client }) {
  const isMobile = useIsMobile();
  const [presetId, setPresetId] = useState('30d');
  const [dateRange, setDateRange] = useState(() => PRESETS.find((p) => p.id === '30d').range());
  const [openAd, setOpenAd] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const { data, isLoading, isError, isMock, lastUpdated, refetch } = useMetaVideoAds(client.slug, dateRange);

  const filteredAds = useMemo(() => {
    if (!data?.ads) return [];
    if (statusFilter === 'ALL') return data.ads;
    return data.ads.filter((a) => a.status === statusFilter);
  }, [data?.ads, statusFilter]);

  const counts = useMemo(() => {
    if (!data?.ads) return { ALL: 0, ACTIVE: 0, PAUSED: 0 };
    return {
      ALL:    data.ads.length,
      ACTIVE: data.ads.filter((a) => a.status === 'ACTIVE').length,
      PAUSED: data.ads.filter((a) => a.status === 'PAUSED').length,
    };
  }, [data?.ads]);

  function onPickRange(range, id) {
    setDateRange(range);
    setPresetId(id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f4f4f5', marginBottom: 2 }}>
            Meta Ads — Video performance
          </h2>
          <p style={{ fontSize: 12, color: '#71717a' }}>
            Alle actieve video advertenties van Meta met spend en performance per creative.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#71717a', display: isMobile ? 'none' : 'inline' }}>
            Bijgewerkt: {lastUpdated ? lastUpdated.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '—'}
          </span>
          <MetaDateRangePicker
            value={dateRange}
            presetId={presetId}
            onChange={onPickRange}
            clientColor={client.color}
          />
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 8, padding: '7px 11px', cursor: isLoading ? 'wait' : 'pointer',
              color: '#d4d4d8', fontSize: 12, fontFamily: 'inherit', fontWeight: 500,
            }}
          >
            <RefreshCw size={13} style={{ animation: isLoading ? 'spin 0.7s linear infinite' : 'none' }} />
            {!isMobile && 'Vernieuwen'}
          </button>
        </div>
      </div>

      {isMock && !isLoading && (
        <div style={{
          background: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.20)',
          borderRadius: 10, padding: '10px 14px',
          fontSize: 12.5, color: '#fdba74',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠️</span>
          <span>
            Demo data — voeg <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: 3 }}>{client.slug.toUpperCase().replace(/-/g, '_')}_META_ACCESS_TOKEN</code>
            {' '}en <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: 3 }}>{client.slug.toUpperCase().replace(/-/g, '_')}_META_AD_ACCOUNT_ID</code> toe aan je Vercel env vars voor live data.
          </span>
        </div>
      )}

      {isError && !isLoading && (
        <div style={{
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
          borderRadius: 10, padding: '14px 18px',
          fontSize: 13, color: '#fca5a5',
        }}>
          Data tijdelijk niet beschikbaar. Probeer het over een paar minuten opnieuw.
        </div>
      )}

      {isLoading || !data ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(6,1fr)', gap: isMobile ? 10 : 14 }}>
            {[0,1,2,3,4,5].map((i) => <Skeleton key={i} h={92} />)}
          </div>
          <Skeleton h={300} />
          <Skeleton h={420} />
        </>
      ) : (
        <>
          <MetaSummaryCards
            ads={data.ads}
            accountReach={data.account_reach}
            clientColor={client.color}
            isMobile={isMobile}
          />

          <MetaInsightsCallouts ads={data.ads} isMobile={isMobile} />

          <MetaSpendChart daily={data.daily} clientColor={client.color} isMobile={isMobile} />

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'ACTIVE', label: 'Actief' },
              { id: 'PAUSED', label: 'Gepauzeerd' },
              { id: 'ALL',    label: 'Alle' },
            ].map((f) => {
              const active = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    padding: '7px 14px', borderRadius: 8,
                    border: '1px solid',
                    borderColor: active ? client.color : 'rgba(255,255,255,0.10)',
                    background: active ? `${client.color}1f` : 'transparent',
                    color: active ? client.color : '#a1a1aa',
                    fontSize: 12, fontWeight: active ? 600 : 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {f.label}
                  <span style={{ marginLeft: 7, opacity: 0.7, fontSize: 11 }}>
                    {counts[f.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <VideoAdsTable
            ads={filteredAds}
            onOpenAd={setOpenAd}
            isMobile={isMobile}
          />

          <AgencyNotesPanel clientSlug={client.slug} clientColor={client.color} />
        </>
      )}

      {openAd && (
        <AdPreviewModal
          ad={openAd}
          perAdDaily={data?.per_ad_daily}
          clientSlug={client.slug}
          onClose={() => setOpenAd(null)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

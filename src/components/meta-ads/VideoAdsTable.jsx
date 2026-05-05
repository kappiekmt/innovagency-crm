import { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, Play } from 'lucide-react';
import { formatEuro, formatNumber, statusColor } from './format';

const COLUMNS = [
  { id: 'thumbnail',  label: 'Video',       sortable: false, width: 84,  align: 'left' },
  { id: 'ad_name',    label: 'Advertentie', sortable: true,  align: 'left' },
  { id: 'status',     label: 'Status',      sortable: true,  align: 'left',  width: 100 },
  { id: 'spend',      label: 'Spend',       sortable: true,  align: 'right' },
  { id: 'impressions',label: 'Vertoningen', sortable: true,  align: 'right' },
  { id: 'results',    label: 'Resultaten',  sortable: true,  align: 'right' },
];

function Thumbnail({ ad, onOpen }) {
  return (
    <button
      onClick={() => onOpen(ad)}
      style={{
        position: 'relative', width: 60, height: 76,
        border: 'none', borderRadius: 8, cursor: 'pointer',
        background: '#1a1d24', overflow: 'hidden', padding: 0,
        flexShrink: 0,
      }}
      title="Bekijk video"
    >
      {ad.thumbnail_url ? (
        <img
          src={ad.thumbnail_url}
          alt={ad.ad_name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#52525b', fontSize: 10,
        }}>
          geen preview
        </div>
      )}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.32)',
        transition: 'background 0.15s',
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'rgba(255,255,255,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Play size={13} fill="#0a0c10" stroke="#0a0c10" style={{ marginLeft: 1 }} />
        </div>
      </div>
    </button>
  );
}

function MobileAdCard({ ad, onOpen }) {
  const sc = statusColor(ad.status);
  return (
    <button
      onClick={() => onOpen(ad)}
      style={{
        display: 'flex', alignItems: 'stretch', gap: 12,
        width: '100%', padding: 12,
        background: 'transparent', border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer', fontFamily: 'inherit',
        textAlign: 'left',
      }}
    >
      <div style={{
        position: 'relative', width: 64, height: 80,
        borderRadius: 8, background: '#1a1d24',
        overflow: 'hidden', flexShrink: 0,
      }}>
        {ad.thumbnail_url ? (
          <img src={ad.thumbnail_url} alt={ad.ad_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy" />
        ) : null}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.32)',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={11} fill="#0a0c10" stroke="#0a0c10" style={{ marginLeft: 1 }} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 6 }}>
        <div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#e4e4e7',
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            lineHeight: 1.3,
          }}>
            {ad.ad_name}
          </div>
          <span style={{
            display: 'inline-block', marginTop: 4,
            padding: '2px 7px', borderRadius: 5,
            fontSize: 10, fontWeight: 600,
            background: sc.bg, color: sc.fg,
          }}>{sc.label}</span>
        </div>

        <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
          <div>
            <div style={{ color: '#71717a', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Spend</div>
            <div style={{ color: '#f4f4f5', fontWeight: 600 }}>{formatEuro(ad.spend)}</div>
          </div>
          <div>
            <div style={{ color: '#71717a', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vert.</div>
            <div style={{ color: '#d4d4d8' }}>{formatNumber(ad.impressions)}</div>
          </div>
          <div>
            <div style={{ color: '#71717a', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Result.</div>
            <div style={{ color: '#d4d4d8' }}>{formatNumber(ad.results)}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function VideoAdsTable({ ads, onOpenAd, isMobile }) {
  const [sortBy, setSortBy] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    const arr = [...ads];
    arr.sort((a, b) => {
      const av = a[sortBy]; const bv = b[sortBy];
      if (typeof av === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? (av - bv) : (bv - av);
    });
    return arr;
  }, [ads, sortBy, sortDir]);

  function clickHeader(col) {
    if (!col.sortable) return;
    if (sortBy === col.id) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col.id); setSortDir(col.align === 'right' ? 'desc' : 'asc'); }
  }

  return (
    <div style={{
      background: '#111318',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{
        padding: isMobile ? '14px 16px' : '16px 22px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, flexWrap: 'wrap',
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 500, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {ads.length} {ads.length === 1 ? 'advertentie' : 'advertenties'}
        </h3>
      </div>

      {isMobile ? (
        <div>
          {sorted.map((ad) => (
            <MobileAdCard key={ad.ad_id} ad={ad} onOpen={onOpenAd} />
          ))}
          {sorted.length === 0 && (
            <div style={{ padding: 28, textAlign: 'center', color: '#71717a', fontSize: 13 }}>
              Geen advertenties gevonden in deze periode.
            </div>
          )}
        </div>
      ) : (
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 12.5,
        }}>
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                const active = sortBy === col.id;
                const Arrow = sortDir === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={col.id}
                    onClick={() => clickHeader(col)}
                    style={{
                      padding: '10px 14px',
                      textAlign: col.align,
                      fontSize: 11,
                      fontWeight: 500,
                      color: active ? '#f4f4f5' : '#71717a',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      width: col.width,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                      {col.label}
                      {active && col.sortable && <Arrow size={11} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((ad, idx) => {
              const sc = statusColor(ad.status);
              return (
                <tr
                  key={ad.ad_id}
                  style={{
                    borderBottom: idx === sorted.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <Thumbnail ad={ad} onOpen={onOpenAd} />
                  </td>
                  <td style={{ padding: '10px 14px', color: '#e4e4e7', fontWeight: 500, maxWidth: 320 }}>
                    <button
                      onClick={() => onOpenAd(ad)}
                      style={{
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                        color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit',
                        textAlign: 'left',
                      }}
                    >
                      {ad.ad_name}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 9px', borderRadius: 6,
                      fontSize: 11, fontWeight: 600,
                      background: sc.bg, color: sc.fg,
                    }}>{sc.label}</span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#f4f4f5', fontWeight: 500 }}>
                    {formatEuro(ad.spend)}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#d4d4d8' }}>
                    {formatNumber(ad.impressions)}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#d4d4d8' }}>
                    {formatNumber(ad.results)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} style={{ padding: '32px', textAlign: 'center', color: '#71717a', fontSize: 13 }}>
                  Geen advertenties gevonden in deze periode.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}

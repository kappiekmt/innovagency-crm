import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { PRESETS } from './datePresets';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' });
}

export default function MetaDateRangePicker({ value, presetId, onChange, clientColor = '#6C00EE' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const label = (() => {
    const p = PRESETS.find((x) => x.id === presetId);
    if (p) return p.label;
    if (value?.since && value?.until) return `${formatDate(value.since)} – ${formatDate(value.until)}`;
    return 'Datumbereik';
  })();

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
          color: '#d4d4d8', fontSize: 12, fontFamily: 'inherit', fontWeight: 500,
        }}
      >
        <Calendar size={14} />
        {label}
        <ChevronDown size={13} style={{ opacity: 0.6 }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20,
            background: '#15181f', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: 6, minWidth: 200,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          {PRESETS.map((p) => {
            const active = p.id === presetId;
            return (
              <button
                key={p.id}
                onClick={() => { onChange(p.range(), p.id); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 12px', borderRadius: 6, border: 'none',
                  background: active ? `${clientColor}1f` : 'transparent',
                  color: active ? clientColor : '#d4d4d8',
                  cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

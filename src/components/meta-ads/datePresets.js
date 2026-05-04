function isoDaysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split('T')[0];
}

function startOfThisMonth() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().split('T')[0];
}

function startOfLastMonth() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().split('T')[0];
}

function endOfLastMonth() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0)).toISOString().split('T')[0];
}

export const PRESETS = [
  { id: '7d',   label: 'Laatste 7 dagen',  range: () => ({ since: isoDaysAgo(7),  until: isoDaysAgo(0) }) },
  { id: '14d',  label: 'Laatste 14 dagen', range: () => ({ since: isoDaysAgo(14), until: isoDaysAgo(0) }) },
  { id: '30d',  label: 'Laatste 30 dagen', range: () => ({ since: isoDaysAgo(30), until: isoDaysAgo(0) }) },
  { id: 'mtd',  label: 'Deze maand',       range: () => ({ since: startOfThisMonth(),  until: isoDaysAgo(0) }) },
  { id: 'lm',   label: 'Vorige maand',     range: () => ({ since: startOfLastMonth(),  until: endOfLastMonth() }) },
];

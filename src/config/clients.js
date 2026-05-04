export const clients = [
  {
    id: 'zitcomfort',
    name: 'Zitcomfort',
    fullName: 'Zitcomfort B.V.',
    initials: 'ZC',
    color: '#6C00EE',
    features: {
      metaVideoAds: true,
    },
  },
  {
    id: 'landgoed-bourtange',
    name: 'Landgoed Bourtange',
    fullName: 'Landgoed Bourtange B.V.',
    initials: 'LB',
    color: '#22c55e',
    features: {},
  },
];

export function getClient(id) {
  return clients.find((c) => c.id === id) ?? null;
}

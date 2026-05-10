// lib/cities.ts
export const CITIES = [
  { name: 'Kigali',    deliveryFee: 500,  active: true  },
  { name: 'Rubavu',    deliveryFee: 400,  active: true  },
  { name: 'Musanze',   deliveryFee: 400,  active: true  },
  { name: 'Rusizi',    deliveryFee: 400,  active: true  },
  { name: 'Huye',      deliveryFee: 400,  active: false },
  { name: 'Nyagatare', deliveryFee: 400,  active: false },
] as const

export type CityName = typeof CITIES[number]['name']

export function getCityDeliveryFee(city: string): number {
  return CITIES.find(c => c.name === city)?.deliveryFee ?? 500
}

export function getActiveCities() {
  return CITIES.filter(c => c.active)
}

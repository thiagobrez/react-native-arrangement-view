export interface Trail {
  id: string;
  name: string;
  region: string;
  distanceKm: number;
  elevationM: number;
  color: string;
  notes: string[];
}

/** Sidebar items. Selecting one shows it in the secondary column. */
export const trails: Trail[] = [
  {
    id: 'ridge',
    name: 'Ridge Loop',
    region: 'Serra do Mar',
    distanceKm: 12.4,
    elevationM: 840,
    color: '#423678',
    notes: ['Start before 8 am', 'Water at km 6', 'Exposed final climb'],
  },
  {
    id: 'falls',
    name: 'Seven Falls',
    region: 'Chapada dos Veadeiros',
    distanceKm: 9.1,
    elevationM: 410,
    color: '#173f4a',
    notes: ['Swim at the third fall', 'Slippery rocks', 'Park closes at 5 pm'],
  },
  {
    id: 'canyon',
    name: 'Canyon Rim',
    region: 'Aparados da Serra',
    distanceKm: 6.8,
    elevationM: 220,
    color: '#4a2f1f',
    notes: ['Fog after noon', 'Stay behind the rail', 'Best light at dusk'],
  },
  {
    id: 'dunes',
    name: 'Dune Crossing',
    region: 'Lençóis Maranhenses',
    distanceKm: 15.2,
    elevationM: 120,
    color: '#5a4a1c',
    notes: ['Lagoons fill in June', 'No shade', 'Bring a GPS track'],
  },
];

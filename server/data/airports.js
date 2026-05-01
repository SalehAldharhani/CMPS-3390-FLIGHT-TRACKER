export const AIRPORTS = {
  ATL: { iata: 'ATL', city: 'Atlanta',          lat: 33.6407, lon: -84.4277 },
  BOS: { iata: 'BOS', city: 'Boston',           lat: 42.3656, lon: -71.0096 },
  DEN: { iata: 'DEN', city: 'Denver',           lat: 39.8561, lon: -104.6737 },
  DFW: { iata: 'DFW', city: 'Dallas/Fort Worth', lat: 32.8998, lon: -97.0403 },
  EWR: { iata: 'EWR', city: 'Newark',           lat: 40.6895, lon: -74.1745 },
  IAH: { iata: 'IAH', city: 'Houston',          lat: 29.9902, lon: -95.3368 },
  JFK: { iata: 'JFK', city: 'New York',         lat: 40.6413, lon: -73.7781 },
  LAS: { iata: 'LAS', city: 'Las Vegas',        lat: 36.0840, lon: -115.1537 },
  LAX: { iata: 'LAX', city: 'Los Angeles',      lat: 33.9416, lon: -118.4085 },
  MIA: { iata: 'MIA', city: 'Miami',            lat: 25.7959, lon: -80.2870 },
  ORD: { iata: 'ORD', city: 'Chicago',          lat: 41.9742, lon: -87.9073 },
  PHX: { iata: 'PHX', city: 'Phoenix',          lat: 33.4373, lon: -112.0078 },
  SEA: { iata: 'SEA', city: 'Seattle',          lat: 47.4502, lon: -122.3088 },
  SFO: { iata: 'SFO', city: 'San Francisco',    lat: 37.6213, lon: -122.3790 },

  YYZ: { iata: 'YYZ', city: 'Toronto',          lat: 43.6777, lon: -79.6248 },
  YVR: { iata: 'YVR', city: 'Vancouver',        lat: 49.1967, lon: -123.1815 },
  MEX: { iata: 'MEX', city: 'Mexico City',      lat: 19.4361, lon: -99.0719 },

  AMS: { iata: 'AMS', city: 'Amsterdam',        lat: 52.3105, lon: 4.7683 },
  BCN: { iata: 'BCN', city: 'Barcelona',        lat: 41.2974, lon: 2.0833 },
  CDG: { iata: 'CDG', city: 'Paris',            lat: 49.0097, lon: 2.5479 },
  DUB: { iata: 'DUB', city: 'Dublin',           lat: 53.4264, lon: -6.2499 },
  FCO: { iata: 'FCO', city: 'Rome',             lat: 41.8003, lon: 12.2389 },
  FRA: { iata: 'FRA', city: 'Frankfurt',        lat: 50.0379, lon: 8.5622 },
  IST: { iata: 'IST', city: 'Istanbul',         lat: 41.2753, lon: 28.7519 },
  LGW: { iata: 'LGW', city: 'London (Gatwick)', lat: 51.1537, lon: -0.1821 },
  LHR: { iata: 'LHR', city: 'London',           lat: 51.4700, lon: -0.4543 },
  MAD: { iata: 'MAD', city: 'Madrid',           lat: 40.4983, lon: -3.5676 },
  MUC: { iata: 'MUC', city: 'Munich',           lat: 48.3537, lon: 11.7750 },
  ORY: { iata: 'ORY', city: 'Paris (Orly)',     lat: 48.7233, lon: 2.3794 },
  ZRH: { iata: 'ZRH', city: 'Zurich',           lat: 47.4647, lon: 8.5492 },

  AUH: { iata: 'AUH', city: 'Abu Dhabi',        lat: 24.4330, lon: 54.6511 },
  DOH: { iata: 'DOH', city: 'Doha',             lat: 25.2731, lon: 51.6080 },
  DXB: { iata: 'DXB', city: 'Dubai',            lat: 25.2532, lon: 55.3657 },

  BKK: { iata: 'BKK', city: 'Bangkok',          lat: 13.6900, lon: 100.7501 },
  DEL: { iata: 'DEL', city: 'Delhi',            lat: 28.5562, lon: 77.1000 },
  HKG: { iata: 'HKG', city: 'Hong Kong',        lat: 22.3080, lon: 113.9185 },
  HND: { iata: 'HND', city: 'Tokyo (Haneda)',   lat: 35.5494, lon: 139.7798 },
  ICN: { iata: 'ICN', city: 'Seoul',            lat: 37.4602, lon: 126.4407 },
  NRT: { iata: 'NRT', city: 'Tokyo (Narita)',   lat: 35.7720, lon: 140.3929 },
  PEK: { iata: 'PEK', city: 'Beijing',          lat: 40.0801, lon: 116.5846 },
  PVG: { iata: 'PVG', city: 'Shanghai',         lat: 31.1434, lon: 121.8052 },
  SIN: { iata: 'SIN', city: 'Singapore',        lat: 1.3644,  lon: 103.9915 },
  TPE: { iata: 'TPE', city: 'Taipei',           lat: 25.0777, lon: 121.2328 },

  AKL: { iata: 'AKL', city: 'Auckland',         lat: -37.0082, lon: 174.7850 },
  MEL: { iata: 'MEL', city: 'Melbourne',        lat: -37.6690, lon: 144.8410 },
  SYD: { iata: 'SYD', city: 'Sydney',           lat: -33.9399, lon: 151.1753 },

  CAI: { iata: 'CAI', city: 'Cairo',            lat: 30.1219, lon: 31.4056 },
  CPT: { iata: 'CPT', city: 'Cape Town',        lat: -33.9648, lon: 18.6017 },
  JNB: { iata: 'JNB', city: 'Johannesburg',     lat: -26.1392, lon: 28.2460 },

  EZE: { iata: 'EZE', city: 'Buenos Aires',     lat: -34.8222, lon: -58.5358 },
  GRU: { iata: 'GRU', city: 'São Paulo',        lat: -23.4356, lon: -46.4731 },
};

export function lookupAirport(iata) {
  if (!iata) return { iata: '', city: '', lat: 0, lon: 0 };

  const upper = String(iata).toUpperCase();
  if (AIRPORTS[upper]) return AIRPORTS[upper];

  return { iata: upper, city: upper, lat: 0, lon: 0 };
}

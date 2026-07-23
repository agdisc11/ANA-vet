import { createContext, useContext, useMemo, useState } from 'react';

const SelectedAnimalContext = createContext();

export const speciesColorMap = {
  perro: '#B7791F',
  gato: '#4A5568',
  conejo: '#9F7AEA',
  ave: '#319795',
  reptil: '#2F855A',
  huron: '#805AD5',
  caballo: '#D69E2E',
  default: '#4B5563',
};

export const breedColorMap = {
  labrador: '#D69E2E',
  'pastor alemán': '#A05622',
  'golden retriever': '#E9A34C',
  beagle: '#DD6B20',
  rottweiler: '#9B2C2C',
  'bulldog francés': '#F6AD55',
  chihuahua: '#F6E05E',
  'shih tzu': '#B794F4',
  siames: '#4A5568',
  persa: '#718096',
  'maine coon': '#6B46C1',
  sphynx: '#A0AEC0',
  bengalí: '#ED8936',
  abisinio: '#C05621',
  ragdoll: '#63B3ED',
  angora: '#F687B3',
  neozelandés: '#9F7AEA',
  'mini lop': '#F56565',
  belier: '#68D391',
  holandés: '#2B6CB0',
  periquito: '#48BB78',
  canario: '#F6E05E',
  cacatúa: '#D69E2E',
  loro: '#38B2AC',
  agapornis: '#2F855A',
  iguana: '#2F855A',
  serpiente: '#718096',
  tortuga: '#2C7A7B',
  camaleón: '#38A169',
  gecko: '#68D391',
  'pura sangre': '#C05621',
  andaluz: '#805AD5',
  'cuarto de milla': '#D69E2E',
  criollo: '#CC7722',
  frisón: '#2D3748',
};

export function stringToColor(value) {
  const str = value?.trim().toLowerCase() || '';
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 60%, 50%)`;
}

function getAnimalColor(animal) {
  if (!animal?.especie) return speciesColorMap.default;
  const especie = animal.especie.toLowerCase();
  const breed = animal.raza?.trim().toLowerCase();
  if (breed) {
    return breedColorMap[breed] ?? stringToColor(breed);
  }
  return speciesColorMap[especie] ?? speciesColorMap.default;
}

function isDarkColor(hex) {
  if (!hex?.startsWith('#')) return true;
  const intValue = parseInt(hex.slice(1), 16);
  const r = (intValue >> 16) & 255;
  const g = (intValue >> 8) & 255;
  const b = intValue & 255;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 150;
}

export function SelectedAnimalProvider({ children }) {
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  const selectedAnimalColor = useMemo(
    () => getAnimalColor(selectedAnimal),
    [selectedAnimal]
  );

  const selectedAnimalTextColor = useMemo(
    () => (isDarkColor(selectedAnimalColor) ? '#FFFFFF' : '#1F2937'),
    [selectedAnimalColor]
  );

  return (
    <SelectedAnimalContext.Provider
      value={{
        selectedAnimal,
        setSelectedAnimal,
        selectedAnimalColor,
        selectedAnimalTextColor,
      }}
    >
      {children}
    </SelectedAnimalContext.Provider>
  );
}

export function useSelectedAnimal() {
  const context = useContext(SelectedAnimalContext);
  if (!context) {
    throw new Error('useSelectedAnimal must be used within SelectedAnimalProvider');
  }
  return context;
}

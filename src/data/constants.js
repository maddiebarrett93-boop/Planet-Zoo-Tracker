// ─── Official PZ Tag Databases ─────────────────────────────────────────────

export const REGIONS = [
  'Africa', 'Europe', 'North America', 'South & Central America',
  'Asia', 'Oceania', 'Antarctica'
];

export const BIOMES = [
  'Aquatic', 'Desert', 'Grassland', 'Temperate', 'Tropical', 'Tundra', 'Taiga'
];

export const CONSERVATION_STATUSES = [
  'Least Concern', 'Near Threatened', 'Vulnerable',
  'Endangered', 'Critically Endangered', 'Extinct in the Wild'
];

export const DISPOSITION = ['Keep', 'Sell', 'Release'];
export const SEXES = ['Male', 'Female'];
export const AGE_STAGES = ['Juvenile', 'Adult', 'Elder'];

export const APPEAL_MAX = 6250;
export const JUVENILE_MODIFIER = 0.15; // 15% of base appeal

export const APPEAL_TIERS = [
  { label: 'Normal', min: 0,    max: 1249, color: '#7a9460' },
  { label: 'Bronze', min: 1250, max: 3124, color: '#c87a30' },
  { label: 'Silver', min: 3125, max: 5624, color: '#8ab0c8' },
  { label: 'Gold',   min: 5625, max: 6250, color: '#c8a830' },
];

export const HABITAT_STATUSES = ['Planning', 'Under Construction', 'Active', 'Needs Upgrade'];
export const SOCIAL_STRUCTURES = ['Solitary', 'Matrilineal', 'Patrilineal', 'Gregarious', 'Pair Bond'];

export const INFRASTRUCTURE_TYPES = {
  common: ['Habitats', 'Exhibits'],
  pz2only: ['Aviaries', 'Aquariums'],
};

export const FACILITY_TYPES = ['Info Booth', 'Toilet', 'First Aid', 'ATM'];
export const VENDOR_TYPES = ['Food Stall', 'Drink Stall', 'Merchandise'];

// ─── Re-export animal databases ────────────────────────────────────────────
export { PZ1_ANIMALS, PZ1_ANIMAL_MAP } from './pz1_animals.js';
export { PZ2_ANIMALS, PZ2_ANIMAL_MAP } from './pz2_animals.js';

// ─── Sample Data ──────────────────────────────────────────────────────────
export const SAMPLE_ANIMALS = [
  { id: 1, species: 'African Elephant', habitat: 'Savanna Flats', males: 1, females: 3, conservationStatus: 'Vulnerable', notes: '' },
  { id: 2, species: 'Amur Tiger', habitat: 'Tiger Territory', males: 2, females: 2, conservationStatus: 'Endangered', notes: '' },
  { id: 3, species: 'Giant Panda', habitat: 'Bamboo Grove', males: 1, females: 1, conservationStatus: 'Vulnerable', notes: '' },
  { id: 4, species: 'Snow Leopard', habitat: 'Mountain Pass', males: 1, females: 2, conservationStatus: 'Vulnerable', notes: '' },
  { id: 5, species: 'Black Rhinoceros', habitat: 'Rhino Reserve', males: 1, females: 1, conservationStatus: 'Critically Endangered', notes: '' },
];

export const SAMPLE_ROSTER = [
  { id: 1, species: 'Amur Tiger', name: 'Kira', sex: 'Female', ageStage: 'Adult', fertility: 92, immunity: 88, size: 85, longevity: 90, appeal: 3200, mate: 'Baikal', offspring: 'Sasha, Nova', disposition: 'Keep', isAlpha: false, isBonded: true, isOutsider: false, socialStructure: 'Solitary' },
  { id: 2, species: 'Amur Tiger', name: 'Baikal', sex: 'Male', ageStage: 'Adult', fertility: 88, immunity: 94, size: 96, longevity: 87, appeal: 4600, mate: 'Kira', offspring: 'Sasha, Nova', disposition: 'Keep', isAlpha: true, isBonded: true, isOutsider: false, socialStructure: 'Solitary' },
  { id: 3, species: 'Amur Tiger', name: 'Sasha', sex: 'Male', ageStage: 'Juvenile', fertility: 78, immunity: 82, size: 80, longevity: 85, appeal: 800, mate: '', offspring: '', disposition: 'Sell', isAlpha: false, isBonded: false, isOutsider: false, socialStructure: 'Solitary' },
  { id: 4, species: 'African Elephant', name: 'Amara', sex: 'Female', ageStage: 'Elder', fertility: 95, immunity: 91, size: 88, longevity: 93, appeal: 2800, mate: 'Kibo', offspring: 'Toto, Zuri', disposition: 'Keep', isAlpha: true, isBonded: true, isOutsider: false, socialStructure: 'Matrilineal' },
];

export const SAMPLE_CONSERVATION = [
  { id: 1, species: 'Amur Tiger', goalPop: 10, currentPop: 4, releaseGoal: 5, released: 0 },
  { id: 2, species: 'Black Rhinoceros', goalPop: 6, currentPop: 2, releaseGoal: 2, released: 0 },
  { id: 3, species: 'Giant Panda', goalPop: 4, currentPop: 2, releaseGoal: 1, released: 0 },
  { id: 4, species: 'African Elephant', goalPop: 8, currentPop: 4, releaseGoal: 0, released: 0 },
];

export const SAMPLE_HABITATS = [
  { id: 1, regions: ['Asia'], biomes: ['Taiga', 'Temperate'], species: 'Amur Tiger', habitatType: 'Habitats', actualLandSpace: 6400, actualWaterSpace: 0, baseSpace: 5120, perAdditionalSpace: 1280, adultCount: 2, guestRating: 4.8, features: 'Water feature, climbing rocks', status: 'Active', socialStructure: 'Solitary' },
  { id: 2, regions: ['Africa'], biomes: ['Grassland'], species: 'African Elephant', habitatType: 'Habitats', actualLandSpace: 12500, actualWaterSpace: 200, baseSpace: 7500, perAdditionalSpace: 2500, adultCount: 3, guestRating: 4.9, features: 'Mud bath, waterhole', status: 'Active', socialStructure: 'Matrilineal' },
];

export const SAMPLE_BLOODLINES = [
  { id: 1, name: 'Sasha', father: 'Baikal', mother: 'Kira', species: 'Amur Tiger', generation: 1, disposition: 'Sell' },
  { id: 2, name: 'Nova', father: 'Baikal', mother: 'Kira', species: 'Amur Tiger', generation: 1, disposition: 'Keep' },
  { id: 3, name: 'Toto', father: 'Kibo', mother: 'Amara', species: 'African Elephant', generation: 1, disposition: 'Keep' },
  { id: 4, name: 'Zuri', father: 'Kibo', mother: 'Amara', species: 'African Elephant', generation: 1, disposition: 'Release' },
];

export const SAMPLE_PEEPS = {
  zones: ['Main Entrance', 'Africa Hub', 'Asia Hub', 'Americas Zone', 'Polar Zone'],
  facilities: [],
  vendors: [],
};

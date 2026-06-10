export const REGIONS = ['Africa','Europe','North America','South & Central America','Asia','Oceania','Antarctica'];
export const BIOMES = ['Aquatic','Desert','Grassland','Temperate','Tropical','Tundra','Taiga'];
export const CONSERVATION_STATUSES = ['Least Concern','Near Threatened','Vulnerable','Endangered','Critically Endangered','Extinct in the Wild'];
export const DISPOSITION = ['Keep','Sell','Release'];
export const SEXES = ['Male','Female'];
export const AGE_STAGES = ['Juvenile','Adult','Elder'];
export const APPEAL_MAX = 6250;
export const JUVENILE_MODIFIER = 0.15;
export const APPEAL_TIERS = [
  { label: 'Normal', min: 0,    max: 1249, color: '#7a9460' },
  { label: 'Bronze', min: 1250, max: 3124, color: '#c87a30' },
  { label: 'Silver', min: 3125, max: 5624, color: '#8ab0c8' },
  { label: 'Gold',   min: 5625, max: 6250, color: '#c8a830' },
];
export const HABITAT_STATUSES = ['Planning','Under Construction','Active','Needs Upgrade'];
export const SOCIAL_STRUCTURES = ['Solitary','Matrilineal','Patrilineal','Gregarious','Pair Bond'];
export const FACILITY_TYPES = ['Info Booth','Toilet','ATM'];
export const RESTAURANT_BRANDS = ['Chief Beef','Mexelente','Street Fox Coffee','Lotus Kitchen','Jungle Juice Bar','Polar Pops','Other'];
export const VENDOR_TYPES = ['Food Stall','Drink Stall','Merchandise'];
export const VENDOR_BRANDS = {
  'Food Stall': ['Chief Beef','Mexelente','Jungle Grill','Other'],
  'Drink Stall': ['Street Fox Coffee','Jungle Juice Bar','Polar Pops','Other'],
  'Merchandise': ['Zoo Shop','Nature Store','Other'],
};
export { PZ1_ANIMALS, PZ1_ANIMAL_MAP } from './pz1_animals.js';
export { PZ2_ANIMALS, PZ2_ANIMAL_MAP } from './pz2_animals.js';
export const SAMPLE_PEEPS = {
  zones: ['Main Entrance','Africa Hub','Asia Hub','Americas Zone','Polar Zone'],
  facilities: [], vendors: [], restaurants: [],
};
export const DEFAULT_ZOO = () => ({
  id: `zoo_${Date.now()}`,
  name: 'My Zoo',
  customStats: '',
  animals: [],
  roster: [],
  conservation: [],
  habitats: [],
  bloodlines: [],
  peeps: { zones: ['Main Entrance','Africa Hub','Asia Hub'], facilities: [], vendors: [], restaurants: [] },
  createdAt: Date.now(),
});

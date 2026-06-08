export const CONSERVATION_STATUSES = [
  'Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered', 'Extinct in the Wild'
];

export const REGIONS = ['Africa', 'Americas', 'Asia', 'Australia', 'Europe', 'Polar'];

export const BIOMES = ['Temperate', 'Tropical', 'Grassland', 'Savanna', 'Desert', 'Wetland', 'Alpine', 'Tundra', 'Boreal', 'Mediterranean', 'Rainforest', 'Scrubland'];

export const DISPOSITION = ['Keep', 'Sell', 'Release'];

export const SEXES = ['Male', 'Female'];

export const AGE_STAGES = ['Juvenile', 'Adult', 'Elder'];

export const APPEAL_TIERS = [
  { label: 'Normal', min: 0, max: 999, color: '#7a9460' },
  { label: 'Bronze', min: 1000, max: 2499, color: '#c87a30' },
  { label: 'Silver', min: 2500, max: 4499, color: '#8ab0c8' },
  { label: 'Gold', min: 4500, max: 5000, color: '#c8a830' },
];

export const HABITAT_STATUSES = ['Planning', 'Under Construction', 'Active', 'Needs Upgrade'];

export const SPECIES_LIST = [
  'African Elephant', 'African Penguin', 'African Wild Dog', 'Aldabra Giant Tortoise',
  'Amur Leopard', 'Amur Tiger', 'Arabian Oryx', 'Bactrian Camel',
  'Bengal Tiger', 'Black Rhinoceros', 'Blue Wildebeest',
  'Bonobo', 'Bornean Orangutan', 'Capybara', 'Cheetah',
  'Chimpanzee', 'Chinese Giant Salamander', 'Clouded Leopard',
  'Dhole', 'Eastern Lowland Gorilla', 'Fennec Fox', 'Fossa', 'Galapagos Giant Tortoise',
  'Gaur', 'Gelada', 'Giant Anteater', 'Giant Panda', 'Giraffe',
  'Gorilla', 'Grizzly Bear', 'Hippopotamus', 'Indian Elephant',
  'Jaguar', 'Koala', 'Komodo Dragon', 'Lion', 'Mandrill', 'Meerkat',
  'Nile Hippopotamus', 'Okapi', 'Plains Zebra', 'Polar Bear',
  "Przewalski's Horse", 'Pygmy Hippopotamus', 'Red Panda', 'Red Wolf',
  'Ring-tailed Lemur', 'Saltwater Crocodile', 'Sloth Bear', 'Snow Leopard',
  'Sumatran Orangutan', 'Sumatran Tiger', "Thomson's Gazelle", 'Warthog',
  'White Rhinoceros', 'Wolf', 'Wolverine', 'Wombat'
];

export const SAMPLE_ANIMALS = [
  { id: 1, species: 'African Elephant', habitat: 'Savanna Flats', males: 1, females: 3, conservationStatus: 'Vulnerable', notes: 'Breeding pair doing well' },
  { id: 2, species: 'Amur Tiger', habitat: 'Tiger Territory', males: 2, females: 2, conservationStatus: 'Endangered', notes: 'Two cubs born last season' },
  { id: 3, species: 'Giant Panda', habitat: 'Bamboo Grove', males: 1, females: 1, conservationStatus: 'Vulnerable', notes: 'On conservation loan' },
  { id: 4, species: 'Snow Leopard', habitat: 'Mountain Pass', males: 1, females: 2, conservationStatus: 'Vulnerable', notes: '' },
  { id: 5, species: 'Black Rhinoceros', habitat: 'Rhino Reserve', males: 1, females: 1, conservationStatus: 'Critically Endangered', notes: 'Part of SSP program' },
];

export const SAMPLE_BREEDING = [
  { id: 1, species: 'Amur Tiger', name: 'Kira', sex: 'Female', ageStage: 'Adult', fertility: 92, immunity: 88, size: 85, longevity: 90, appeal: 3200, mate: 'Baikal', offspring: 'Sasha, Nova', disposition: 'Keep' },
  { id: 2, species: 'Amur Tiger', name: 'Baikal', sex: 'Male', ageStage: 'Adult', fertility: 88, immunity: 94, size: 96, longevity: 87, appeal: 4600, mate: 'Kira', offspring: 'Sasha, Nova', disposition: 'Keep' },
  { id: 3, species: 'Amur Tiger', name: 'Sasha', sex: 'Male', ageStage: 'Juvenile', fertility: 78, immunity: 82, size: 80, longevity: 85, appeal: 800, mate: '', offspring: '', disposition: 'Sell' },
  { id: 4, species: 'African Elephant', name: 'Amara', sex: 'Female', ageStage: 'Elder', fertility: 95, immunity: 91, size: 88, longevity: 93, appeal: 2800, mate: 'Kibo', offspring: 'Toto, Zuri', disposition: 'Keep' },
];

export const SAMPLE_CONSERVATION = [
  { id: 1, species: 'Amur Tiger', goalPop: 10, currentPop: 4, releaseGoal: 5, released: 0 },
  { id: 2, species: 'Black Rhinoceros', goalPop: 6, currentPop: 2, releaseGoal: 2, released: 0 },
  { id: 3, species: 'Giant Panda', goalPop: 4, currentPop: 2, releaseGoal: 1, released: 0 },
  { id: 4, species: 'African Elephant', goalPop: 8, currentPop: 4, releaseGoal: 0, released: 0 },
];

export const SAMPLE_HABITATS = [
  { id: 1, regions: ['Asia'], biomes: ['Boreal', 'Temperate'], species: 'Amur Tiger', size: 4200, guestRating: 4.8, features: 'Water feature, climbing rocks, viewing platform', status: 'Active' },
  { id: 2, regions: ['Africa'], biomes: ['Savanna', 'Grassland'], species: 'African Elephant', size: 8500, guestRating: 4.9, features: 'Mud bath, waterhole, shade trees', status: 'Active' },
  { id: 3, regions: ['Asia'], biomes: ['Temperate'], species: 'Giant Panda', size: 3200, guestRating: 4.7, features: 'Bamboo grove, enrichment area', status: 'Active' },
  { id: 4, regions: ['Africa', 'Americas'], biomes: ['Grassland', 'Scrubland'], species: 'Black Rhinoceros', size: 5100, guestRating: 4.4, features: 'Mud pit, salt lick', status: 'Needs Upgrade' },
];

export const SAMPLE_BLOODLINES = [
  { id: 1, name: 'Sasha', father: 'Baikal', mother: 'Kira', species: 'Amur Tiger', generation: 1, disposition: 'Sell' },
  { id: 2, name: 'Nova', father: 'Baikal', mother: 'Kira', species: 'Amur Tiger', generation: 1, disposition: 'Keep' },
  { id: 3, name: 'Toto', father: 'Kibo', mother: 'Amara', species: 'African Elephant', generation: 1, disposition: 'Keep' },
  { id: 4, name: 'Zuri', father: 'Kibo', mother: 'Amara', species: 'African Elephant', generation: 1, disposition: 'Release' },
];

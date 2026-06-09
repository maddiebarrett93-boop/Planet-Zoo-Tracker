import { PZ1_ANIMALS } from './pz1_animals.js';

// PZ2 additional species (confirmed launch roster)
export const PZ2_NEW_ANIMALS = [
  { name: "Hawksbill Turtle", conservationStatus: "Critically Endangered", region: "Oceania", biomes: ["Aquatic"], socialStructure: "Solitary", baseSpace: 800, perAdditionalSpace: 300, minGroupSize: 1, maxGroupSize: 3, compatibleAnimals: [], appeal: 1800 },
  { name: "Toco Toucan", conservationStatus: "Least Concern", region: "South & Central America", biomes: ["Tropical"], socialStructure: "Pair Bond", baseSpace: 300, perAdditionalSpace: 100, minGroupSize: 1, maxGroupSize: 6, compatibleAnimals: [], appeal: 1000 },
  { name: "Reef Manta Ray", conservationStatus: "Vulnerable", region: "Oceania", biomes: ["Aquatic"], socialStructure: "Gregarious", baseSpace: 2000, perAdditionalSpace: 600, minGroupSize: 1, maxGroupSize: 8, compatibleAnimals: [], appeal: 2200 },
  { name: "Nile Crocodile", conservationStatus: "Least Concern", region: "Africa", biomes: ["Aquatic", "Grassland"], socialStructure: "Solitary", baseSpace: 700, perAdditionalSpace: 250, minGroupSize: 1, maxGroupSize: 4, compatibleAnimals: [], appeal: 1400 },
  { name: "Cassowary", conservationStatus: "Least Concern", region: "Oceania", biomes: ["Tropical"], socialStructure: "Solitary", baseSpace: 600, perAdditionalSpace: 200, minGroupSize: 1, maxGroupSize: 2, compatibleAnimals: [], appeal: 1000 },
  { name: "Spotted Hyena", conservationStatus: "Least Concern", region: "Africa", biomes: ["Grassland", "Savanna", "Desert"], socialStructure: "Matrilineal", baseSpace: 2500, perAdditionalSpace: 600, minGroupSize: 2, maxGroupSize: 12, compatibleAnimals: [], appeal: 1200 },
  { name: "Scarlet Macaw", conservationStatus: "Least Concern", region: "South & Central America", biomes: ["Tropical"], socialStructure: "Pair Bond", baseSpace: 300, perAdditionalSpace: 100, minGroupSize: 1, maxGroupSize: 6, compatibleAnimals: [], appeal: 1000 },
  { name: "Green Sea Turtle", conservationStatus: "Endangered", region: "Oceania", biomes: ["Aquatic"], socialStructure: "Solitary", baseSpace: 800, perAdditionalSpace: 300, minGroupSize: 1, maxGroupSize: 4, compatibleAnimals: [], appeal: 1600 },
  { name: "Bull Shark", conservationStatus: "Near Threatened", region: "South & Central America", biomes: ["Aquatic"], socialStructure: "Solitary", baseSpace: 2000, perAdditionalSpace: 700, minGroupSize: 1, maxGroupSize: 3, compatibleAnimals: [], appeal: 2000 },
  { name: "Hammerhead Shark", conservationStatus: "Endangered", region: "Oceania", biomes: ["Aquatic"], socialStructure: "Gregarious", baseSpace: 2500, perAdditionalSpace: 800, minGroupSize: 1, maxGroupSize: 6, compatibleAnimals: [], appeal: 2200 },
  { name: "Emperor Penguin", conservationStatus: "Near Threatened", region: "Antarctica", biomes: ["Tundra", "Aquatic"], socialStructure: "Gregarious", baseSpace: 400, perAdditionalSpace: 100, minGroupSize: 2, maxGroupSize: 20, compatibleAnimals: ["Polar Bear"], appeal: 1200 },
  { name: "Bottlenose Dolphin", conservationStatus: "Least Concern", region: "Oceania", biomes: ["Aquatic"], socialStructure: "Gregarious", baseSpace: 3000, perAdditionalSpace: 800, minGroupSize: 2, maxGroupSize: 10, compatibleAnimals: [], appeal: 2800 },
];

export const PZ2_ANIMALS = [...PZ1_ANIMALS, ...PZ2_NEW_ANIMALS].sort((a, b) => a.name.localeCompare(b.name));
export const PZ2_ANIMAL_MAP = Object.fromEntries(PZ2_ANIMALS.map(a => [a.name, a]));

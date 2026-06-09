// Full 212-animal roster from scraper
// Fields match the Zoopedia card layout exactly
// Fill in as you go — all fields optional except name

export const ZOOPEDIA_ANIMALS = [
  "Aardvark","Addax","African Buffalo","African Crested Porcupine","African Leopard",
  "African Penguin","African Savannah Elephant","African Spurred Tortoise","African Wild Dog",
  "Aldabra Giant Tortoise","Alpaca","Alpine Goat","Alpine Ibex","Amazonian Giant Centipede",
  "American Alligator","American Bison","American Bullfrog","American Flamingo",
  "American Standard Donkey","Amur Leopard","Arctic Fox","Arctic Wolf",
  "Asian Small-Clawed Otter","Asian Water Monitor","Axolotl","Bactrian Camel",
  "Baird's Tapir","Bengal Tiger","Bighorn Sheep","Binturong","Black Rhinoceros",
  "Black Wildebeest","Black-Tailed Prairie Dog","Black-and-White Ruffed Lemur","Blackbuck",
  "Blue Wildebeest","Boa Constrictor","Bongo","Bonobo","Bornean Elephant","Bornean Orangutan",
  "Brazilian Salmon Pink Tarantula","Brazilian Wandering Spider","Brown-Throated Sloth",
  "Bush Dog","California Sea Lion","Capybara","Caracal","Cheetah","Chinese Pangolin",
  "Clouded Leopard","Cloudless Sulphur","Collared Peccary",
  "Colombian White-Faced Capuchin Monkey","Common Death Adder","Common Ostrich",
  "Common Warthog","Common Wombat","Coquerel's Sifaka","Cougar","Coyote",
  "Cuvier's Dwarf Caiman","Dall Sheep","Dama Gazelle","Danube Crested Newt",
  "Desert Horned Viper","Dhole","Diamondback Terrapin","Dingo","Dromedary Camel",
  "Eastern Blue Tongued Lizard","Eastern Brown Snake","Egyptian Fruit Bat","Emu",
  "Eurasian Lynx","European Badger","European Fallow Deer","European Peacock","Fennec Fox",
  "Fire Salamander","Formosan Black Bear","Fossa","Galapagos Giant Tortoise","Gemsbok",
  "Gharial","Giant Anteater","Giant Burrowing Cockroach","Giant Desert Hairy Scorpion",
  "Giant Forest Scorpion","Giant Malaysian Leaf Insect","Giant Otter","Giant Panda",
  "Giant Tiger Land Snail","Gila Monster","Golden Poison Frog","Goliath Beetle",
  "Goliath Birdeater","Goliath Frog","Greater Flamingo","Greater Rhea","Green Iguana",
  "Grey Seal","Grey Wolf","Grizzly Bear","Hamadryas Baboon","Hermann's Tortoise",
  "Highland Cattle","Hill Radnor Sheep","Himalayan Brown Bear","Hippopotamus","Honey Badger",
  "Indian Elephant","Indian Peafowl","Indian Rhinoceros","Jaguar","Japanese Macaque",
  "Japanese Raccoon Dog","King Penguin","Kirk's Dik-Dik","Koala","Komodo Dragon",
  "Lar Gibbon","Lehmann's Poison Frog","Lesser Antillean Iguana","Lion-Tailed Macaque",
  "Little Penguin","Llama","Malabar Rose","Malayan Tapir","Mandrill","Maned Wolf",
  "Markhor","Meerkat","Menelaus Blue Morpho","Mexican Red Knee Tarantula","Monarch",
  "Moose","Mute Swan","Nile Lechwe","Nile Monitor","Nilgai","Nine-Banded Armadillo",
  "North American Beaver","North Island Brown Kiwi","North Sulawesi Babirusa","Nyala",
  "Ocelot","Okapi","Old World Swallowtail","Pallas's Cat","Plains Zebra","Platypus",
  "Polar Bear","Proboscis Monkey","Pronghorn Antelope","Przewalski's Horse","Puff Adder",
  "Pygmy Hippopotamus","Père David's Deer","Quokka","Raccoon","Red Deer","Red Fox",
  "Red Kangaroo","Red Panda","Red River Hog","Red Ruffed Lemur","Red-Crowned Crane",
  "Red-Eyed Tree Frog","Red-Necked Wallaby","Reindeer","Reticulated Giraffe",
  "Ring Tailed Lemur","Sable Antelope","Sacred Scarab Beetle","Saiga","Saltwater Crocodile",
  "Sand Cat","Scimitar-Horned Oryx","Siamang","Siberian Tiger","Sloth Bear","Snow Leopard",
  "Somali Wild Ass","Southern Cassowary","Southern White Rhinoceros","Spectacled Bear",
  "Spectacled Caiman","Spectacled Flying Fox","Spotted Hyena","Springbok","Striped Hyena",
  "Striped Skunk","Sun Bear","Sussex Chicken","Takin","Tamworth Pig","Tasmanian Devil",
  "Thomson's Gazelle","Titan Beetle","West African Lion","Western Chimpanzee",
  "Western Diamondback Rattlesnake","Western Lowland Gorilla","White-Faced Saki",
  "Wild Boar","Wild Water Buffalo","Wisent","Wolverine","Yellow Anaconda"
].sort();

// Empty template — shape of a fully filled entry
export const EMPTY_ZOOPEDIA_ENTRY = {
  // Gameplay
  interactivity: "",       // "Full" | "Partial" | "None"
  edition: "",             // "Standard" | "Deluxe" | "DLC"
  // Origins
  continents: [],
  regions: "",
  iucnStatus: "",
  // Habitat
  fenceGrade: "",          // e.g. "2 (>1.25m)"
  baseLand: "",
  addLand: "",
  baseWater: "",
  addWater: "",
  tempMin: "",
  tempMax: "",
  biomes: [],
  // Social
  groupSizeMin: "",
  groupSizeMax: "",
  maleBachelor: "",
  femaleBachelor: "",
  socialNote: "",          // e.g. "up to 1 male, up to 5 females"
  // Reproduction
  reproductionStyle: "",   // e.g. "Very Easy (Polygynous)"
  maturity: "",            // e.g. "4 years"
  sterility: "",           // e.g. "Death"
  gestation: "",           // e.g. "13 months"
  interbirth: "",          // e.g. "12 months"
  // Custom
  appeal: "",
  compatibleAnimals: [],
  notes: "",
};

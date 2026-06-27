export const MAP_SIZES = {
    small: { width: 30, height: 20 },
    medium: { width: 50, height: 35 },
    large: { width: 80, height: 50 }
};

export const HEX_SIZE = 32;

export const TERRAIN = {
    PLAINS:    { id: 0, name: 'Plains',    color: '#7cb342', moveCost: 1, defBonus: 0,   food: 2, production: 1, gold: 1, passable: true,  naval: false },
    FOREST:    { id: 1, name: 'Forest',    color: '#2e7d32', moveCost: 2, defBonus: 0.25, food: 1, production: 2, gold: 0, passable: true,  naval: false },
    MOUNTAINS: { id: 2, name: 'Mountains', color: '#78909c', moveCost: 4, defBonus: 0.5, food: 0, production: 1, gold: 1, passable: true,  naval: false },
    HILLS:     { id: 3, name: 'Hills',     color: '#8d6e63', moveCost: 2, defBonus: 0.3, food: 1, production: 2, gold: 0, passable: true,  naval: false },
    DESERT:    { id: 4, name: 'Desert',    color: '#e8c96e', moveCost: 2, defBonus: 0,   food: 0, production: 0, gold: 1, passable: true,  naval: false },
    SWAMP:     { id: 5, name: 'Swamp',     color: '#5d7a3e', moveCost: 3, defBonus: 0.1, food: 1, production: 0, gold: 0, passable: true,  naval: false },
    RIVER:     { id: 6, name: 'River',     color: '#4fc3f7', moveCost: 2, defBonus: -0.1,food: 2, production: 0, gold: 1, passable: true,  naval: false },
    COAST:     { id: 7, name: 'Coast',     color: '#81d4fa', moveCost: 1, defBonus: 0,   food: 1, production: 0, gold: 2, passable: true,  naval: true },
    OCEAN:     { id: 8, name: 'Ocean',     color: '#1565c0', moveCost: 1, defBonus: 0,   food: 1, production: 0, gold: 1, passable: false, naval: true },
    SNOW:      { id: 9, name: 'Snow',      color: '#e0e0e0', moveCost: 2, defBonus: 0.1, food: 0, production: 0, gold: 0, passable: true,  naval: false },
    TUNDRA:    { id: 10, name: 'Tundra',   color: '#b0bec5', moveCost: 2, defBonus: 0.1, food: 1, production: 1, gold: 0, passable: true,  naval: false },
    ROAD:      { id: 11, name: 'Road',     color: '#9e9e9e', moveCost: 0.5, defBonus: -0.1, food: 0, production: 0, gold: 2, passable: true, naval: false }
};

export const TERRAIN_BY_ID = Object.values(TERRAIN);

export const CITY_LEVELS = [
    { name: 'Village',         population: 0,    slots: 2, goldMult: 1.0, foodMult: 1.0, industryMult: 1.0, scienceMult: 1.0, icon: '\u{1F3D8}' },
    { name: 'Town',            population: 5,    slots: 4, goldMult: 1.5, foodMult: 1.3, industryMult: 1.3, scienceMult: 1.2, icon: '\u{1F3D9}' },
    { name: 'City',            population: 12,   slots: 6, goldMult: 2.0, foodMult: 1.6, industryMult: 1.8, scienceMult: 1.5, icon: '\u{1F3DB}' },
    { name: 'Industrial City', population: 25,   slots: 8, goldMult: 3.0, foodMult: 2.0, industryMult: 2.5, scienceMult: 2.0, icon: '\u{1F3ED}' },
    { name: 'Metropolis',      population: 50,   slots: 12, goldMult: 4.0, foodMult: 2.5, industryMult: 3.5, scienceMult: 3.0, icon: '\u{1F306}' }
];

export const BUILDINGS = {
    barracks:         { name: 'Barracks',          category: 'military',      cost: { gold: 100, production: 50 },  effects: { recruitSpeed: 1.2 }, prereqTech: null, description: 'Trains ground forces faster' },
    arsenal:          { name: 'Arsenal',           category: 'military',      cost: { gold: 200, production: 100 }, effects: { unitAttack: 0.1 }, prereqTech: 'industrialization', description: 'Increases unit attack power' },
    militaryAcademy:  { name: 'Military Academy',  category: 'military',      cost: { gold: 300, production: 150 }, effects: { generalXP: 1.5 }, prereqTech: 'militaryScience', description: 'Generals gain experience faster' },
    airBase:          { name: 'Air Base',          category: 'military',      cost: { gold: 400, production: 200 }, effects: { airCapacity: 4 }, prereqTech: 'aviation', description: 'Allows stationing aircraft' },
    navalDockyard:    { name: 'Naval Dockyard',    category: 'military',      cost: { gold: 350, production: 180 }, effects: { navalCapacity: 3 }, prereqTech: 'navigation', description: 'Builds and repairs ships' },
    radarStation:     { name: 'Radar Station',     category: 'military',      cost: { gold: 250, production: 120 }, effects: { visibility: 3 }, prereqTech: 'radar', description: 'Extends visibility range' },
    farm:             { name: 'Farm',              category: 'economic',      cost: { gold: 60, production: 30 },   effects: { food: 3 }, prereqTech: null, description: 'Produces food for the city' },
    factory:          { name: 'Factory',           category: 'economic',      cost: { gold: 200, production: 100 }, effects: { production: 4 }, prereqTech: 'industrialization', description: 'Increases industrial output' },
    bank:             { name: 'Bank',              category: 'economic',      cost: { gold: 150, production: 60 },  effects: { gold: 5 }, prereqTech: 'economics', description: 'Generates additional gold' },
    market:           { name: 'Market',            category: 'economic',      cost: { gold: 80, production: 40 },   effects: { gold: 3, food: 1 }, prereqTech: null, description: 'Boosts local trade' },
    university:       { name: 'University',        category: 'economic',      cost: { gold: 250, production: 100 }, effects: { science: 5 }, prereqTech: 'education', description: 'Generates science output' },
    mine:             { name: 'Mine',              category: 'economic',      cost: { gold: 100, production: 50 },  effects: { production: 3, iron: 1 }, prereqTech: null, description: 'Extracts minerals and ore' },
    roads:            { name: 'Roads',             category: 'infrastructure', cost: { gold: 40, production: 20 },  effects: { movementBonus: 0.5 }, prereqTech: null, description: 'Speeds up movement' },
    bridges:          { name: 'Bridges',           category: 'infrastructure', cost: { gold: 80, production: 40 },  effects: { riverCrossing: true }, prereqTech: 'engineering', description: 'Allows easy river crossing' },
    railroads:        { name: 'Railroads',         category: 'infrastructure', cost: { gold: 200, production: 100 }, effects: { movementBonus: 1.0, supply: 2 }, prereqTech: 'railroad', description: 'Fast transport network' },
    port:             { name: 'Port',              category: 'infrastructure', cost: { gold: 150, production: 80 },  effects: { navalAccess: true, trade: 3 }, prereqTech: 'sailing', description: 'Enables naval trade and transport' },
    fort:             { name: 'Fort',              category: 'defensive',     cost: { gold: 120, production: 80 },  effects: { defense: 0.3 }, prereqTech: null, description: 'Provides defensive bonus' },
    cityWalls:        { name: 'City Walls',        category: 'defensive',     cost: { gold: 150, production: 100 }, effects: { cityDefense: 0.5, hp: 50 }, prereqTech: 'masonry', description: 'Protects city from attack' },
    coastalGuns:      { name: 'Coastal Guns',      category: 'defensive',     cost: { gold: 200, production: 120 }, effects: { navalDefense: 0.4 }, prereqTech: 'ballistics', description: 'Defends coast from naval attack' },
    antiAirBattery:   { name: 'Anti-Air Battery',  category: 'defensive',     cost: { gold: 180, production: 90 },  effects: { airDefense: 0.4 }, prereqTech: 'antiAir', description: 'Protects against air attacks' },
    bunker:           { name: 'Bunker',            category: 'defensive',     cost: { gold: 250, production: 150 }, effects: { defense: 0.5, hp: 100 }, prereqTech: 'fortification', description: 'Heavy fortification structure' }
};

export const UNIT_TYPES = {
    militia:          { name: 'Militia',            category: 'ground',    hp: 60,  atk: 15, def: 10, mov: 2, range: 1, cost: { gold: 30, food: 10 }, prereqTech: null, icon: '⚔' },
    infantry:         { name: 'Infantry',           category: 'ground',    hp: 100, atk: 25, def: 20, mov: 3, range: 1, cost: { gold: 60, food: 20 }, prereqTech: null, icon: '\u{1F6E1}' },
    eliteInfantry:    { name: 'Elite Infantry',     category: 'ground',    hp: 120, atk: 35, def: 30, mov: 3, range: 1, cost: { gold: 120, food: 30 }, prereqTech: 'advancedTraining', icon: '⭐' },
    marines:          { name: 'Marines',            category: 'ground',    hp: 100, atk: 30, def: 25, mov: 3, range: 1, cost: { gold: 100, food: 25 }, prereqTech: 'amphibious', icon: '⚓' },
    engineers:        { name: 'Engineers',          category: 'ground',    hp: 70,  atk: 10, def: 15, mov: 3, range: 1, cost: { gold: 80, food: 15 }, prereqTech: 'engineering', icon: '\u{1F527}' },
    commandos:        { name: 'Commandos',          category: 'ground',    hp: 80,  atk: 40, def: 15, mov: 4, range: 1, cost: { gold: 150, food: 25 }, prereqTech: 'specialOps', icon: '\u{1F5E1}' },
    lightTank:        { name: 'Light Tank',         category: 'armor',     hp: 120, atk: 35, def: 25, mov: 5, range: 1, cost: { gold: 150, iron: 2, oil: 1 }, prereqTech: 'tanks', icon: '\u{1F699}' },
    mediumTank:       { name: 'Medium Tank',        category: 'armor',     hp: 160, atk: 50, def: 35, mov: 4, range: 1, cost: { gold: 250, iron: 3, oil: 2 }, prereqTech: 'armorWarfare', icon: '\u{1F68C}' },
    heavyTank:        { name: 'Heavy Tank',         category: 'armor',     hp: 220, atk: 65, def: 50, mov: 3, range: 1, cost: { gold: 400, iron: 5, oil: 3 }, prereqTech: 'heavyArmor', icon: '\u{1F6A2}' },
    fieldArtillery:   { name: 'Field Artillery',    category: 'artillery', hp: 60,  atk: 45, def: 10, mov: 2, range: 3, cost: { gold: 120, iron: 2 }, prereqTech: 'artillery', icon: '\u{1F4A5}' },
    rocketArtillery:  { name: 'Rocket Artillery',   category: 'artillery', hp: 50,  atk: 60, def: 8,  mov: 2, range: 4, cost: { gold: 200, iron: 3, oil: 1 }, prereqTech: 'rocketry', icon: '\u{1F680}' },
    railwayGun:       { name: 'Railway Gun',        category: 'artillery', hp: 80,  atk: 80, def: 5,  mov: 1, range: 5, cost: { gold: 500, iron: 8 }, prereqTech: 'heavyOrdnance', icon: '\u{1F4A3}' },
    fighter:          { name: 'Fighter',            category: 'air',       hp: 80,  atk: 40, def: 20, mov: 8, range: 6, cost: { gold: 200, oil: 2 }, prereqTech: 'aviation', icon: '✈' },
    bomber:           { name: 'Bomber',             category: 'air',       hp: 100, atk: 60, def: 10, mov: 6, range: 8, cost: { gold: 300, oil: 3 }, prereqTech: 'strategicBombing', icon: '\u{1F4A2}' },
    reconPlane:       { name: 'Recon Plane',        category: 'air',       hp: 50,  atk: 10, def: 10, mov: 10, range: 10, cost: { gold: 100, oil: 1 }, prereqTech: 'aviation', icon: '\u{1F441}' },
    transportAir:     { name: 'Transport Aircraft', category: 'air',       hp: 80,  atk: 0,  def: 10, mov: 8, range: 8, cost: { gold: 150, oil: 2 }, prereqTech: 'airTransport', icon: '\u{1F6EB}' },
    destroyer:        { name: 'Destroyer',          category: 'naval',     hp: 120, atk: 35, def: 25, mov: 5, range: 2, cost: { gold: 200, iron: 3, oil: 2 }, prereqTech: 'navigation', icon: '⛵' },
    cruiser:          { name: 'Cruiser',            category: 'naval',     hp: 160, atk: 50, def: 35, mov: 4, range: 3, cost: { gold: 350, iron: 5, oil: 3 }, prereqTech: 'modernNavy', icon: '\u{1F6A2}' },
    battleship:       { name: 'Battleship',         category: 'naval',     hp: 250, atk: 70, def: 50, mov: 3, range: 4, cost: { gold: 600, iron: 8, oil: 5 }, prereqTech: 'dreadnoughts', icon: '⚗' },
    carrier:          { name: 'Aircraft Carrier',   category: 'naval',     hp: 200, atk: 20, def: 30, mov: 3, range: 2, cost: { gold: 700, iron: 10, oil: 6 }, prereqTech: 'carrierOps', icon: '\u{1F6E9}' },
    submarine:        { name: 'Submarine',          category: 'naval',     hp: 100, atk: 55, def: 15, mov: 4, range: 2, cost: { gold: 250, iron: 4, oil: 2 }, prereqTech: 'submarines', icon: '\u{1F30A}' },
    logisticsTruck:   { name: 'Logistics Truck',    category: 'support',   hp: 50,  atk: 5,  def: 5,  mov: 5, range: 1, cost: { gold: 60, oil: 1 }, prereqTech: 'logistics', icon: '\u{1F69A}' },
    medic:            { name: 'Medic',              category: 'support',   hp: 40,  atk: 0,  def: 5,  mov: 3, range: 1, cost: { gold: 80 }, prereqTech: 'fieldMedicine', icon: '⚕' },
    antiAir:          { name: 'Anti-Air',           category: 'support',   hp: 60,  atk: 30, def: 10, mov: 3, range: 3, cost: { gold: 120, iron: 2 }, prereqTech: 'antiAir', icon: '\u{1F6AB}' },
    supplyConvoy:     { name: 'Supply Convoy',      category: 'support',   hp: 40,  atk: 0,  def: 5,  mov: 4, range: 1, cost: { gold: 50, food: 20 }, prereqTech: null, icon: '\u{1F4E6}' }
};

export const RESOURCES = {
    gold:       { name: 'Gold',            icon: '\u{1F4B0}', color: '#ffd700' },
    food:       { name: 'Food',            icon: '\u{1F33E}', color: '#8bc34a' },
    production: { name: 'Industry',        icon: '⚙',    color: '#ff9800' },
    science:    { name: 'Science',         icon: '\u{1F52C}', color: '#2196f3' },
    oil:        { name: 'Oil',             icon: '\u{1F6E2}', color: '#212121' },
    coal:       { name: 'Coal',            icon: '⚫',    color: '#424242' },
    iron:       { name: 'Iron',            icon: '⚙',    color: '#9e9e9e' },
    timber:     { name: 'Timber',          icon: '\u{1FAB5}', color: '#795548' },
    stone:      { name: 'Stone',           icon: '\u{1FAA8}', color: '#757575' },
    rubber:     { name: 'Rubber',          icon: '⚫',    color: '#4e342e' },
    rareEarth:  { name: 'Rare Earth Metals', icon: '\u{1F48E}', color: '#9c27b0' }
};

export const GENERAL_TRAITS = {
    ironWall:         { name: 'Iron Wall',         effect: { defense: 0.2 }, description: 'Units gain +20% defense' },
    blitzCommander:   { name: 'Blitz Commander',   effect: { attack: 0.15, movement: 1 }, description: '+15% attack, +1 movement' },
    siegeExpert:      { name: 'Siege Expert',      effect: { siegeDamage: 0.3 }, description: '+30% damage to cities' },
    winterSpecialist: { name: 'Winter Specialist', effect: { winterBonus: 0.25 }, description: 'No penalty in snow/tundra' },
    desertFox:        { name: 'Desert Fox',        effect: { desertBonus: 0.25 }, description: 'No penalty in desert' },
    navalGenius:      { name: 'Naval Genius',      effect: { navalAttack: 0.2 }, description: '+20% naval combat bonus' },
    airCommander:     { name: 'Air Commander',     effect: { airBonus: 0.2 }, description: '+20% air combat effectiveness' },
    logistician:      { name: 'Logistician',       effect: { supply: 2 }, description: '+2 supply range' },
    inspiringLeader:  { name: 'Inspiring Leader',  effect: { morale: 0.2 }, description: '+20% morale for all units' },
    tacticalGenius:   { name: 'Tactical Genius',   effect: { flanking: 0.15 }, description: '+15% flanking bonus' }
};

export const GENERAL_RANKS = [
    { name: 'Lieutenant',       xpRequired: 0,    traitSlots: 1 },
    { name: 'Captain',          xpRequired: 100,  traitSlots: 1 },
    { name: 'Major',            xpRequired: 300,  traitSlots: 2 },
    { name: 'Colonel',          xpRequired: 600,  traitSlots: 2 },
    { name: 'Brigadier General', xpRequired: 1000, traitSlots: 3 },
    { name: 'Major General',    xpRequired: 1500, traitSlots: 3 },
    { name: 'Lieutenant General', xpRequired: 2500, traitSlots: 4 },
    { name: 'General',          xpRequired: 4000, traitSlots: 4 },
    { name: 'Field Marshal',    xpRequired: 6000, traitSlots: 5 }
];

export const TECHS = {
    agriculture:      { name: 'Agriculture',       category: 'economy',    cost: 50,  prereqs: [],                    effects: { food: 2 }, unlocks: [], description: 'Improved farming techniques' },
    mining:           { name: 'Mining',            category: 'economy',    cost: 50,  prereqs: [],                    effects: { production: 2 }, unlocks: ['mine'], description: 'Extract mineral resources' },
    sailing:          { name: 'Sailing',           category: 'economy',    cost: 60,  prereqs: [],                    effects: { navalMovement: true }, unlocks: ['port'], description: 'Basic naval capability' },
    masonry:          { name: 'Masonry',           category: 'infrastructure', cost: 60, prereqs: [],                  effects: {}, unlocks: ['cityWalls'], description: 'Stone construction' },
    bronzeWorking:    { name: 'Bronze Working',    category: 'military',   cost: 50,  prereqs: [],                    effects: { attack: 0.05 }, unlocks: [], description: 'Better weapons' },
    writing:          { name: 'Writing',           category: 'science',    cost: 60,  prereqs: [],                    effects: { science: 1 }, unlocks: [], description: 'Record keeping and knowledge' },
    engineering:      { name: 'Engineering',       category: 'infrastructure', cost: 100, prereqs: ['masonry', 'mining'], effects: {}, unlocks: ['bridges', 'engineers'], description: 'Advanced construction' },
    economics:        { name: 'Economics',         category: 'economy',    cost: 120, prereqs: ['writing'],           effects: { gold: 3 }, unlocks: ['bank'], description: 'Financial systems' },
    education:        { name: 'Education',         category: 'science',    cost: 120, prereqs: ['writing'],           effects: { science: 3 }, unlocks: ['university'], description: 'Formal education' },
    artillery:        { name: 'Artillery',         category: 'military',   cost: 150, prereqs: ['bronzeWorking', 'engineering'], effects: {}, unlocks: ['fieldArtillery'], description: 'Heavy ranged weapons' },
    navigation:       { name: 'Navigation',        category: 'economy',    cost: 130, prereqs: ['sailing'],          effects: {}, unlocks: ['destroyer', 'navalDockyard'], description: 'Ocean-going vessels' },
    militaryScience:  { name: 'Military Science',  category: 'military',   cost: 150, prereqs: ['education', 'bronzeWorking'], effects: {}, unlocks: ['militaryAcademy'], description: 'Professional military training' },
    industrialization:{ name: 'Industrialization',  category: 'industry',   cost: 200, prereqs: ['engineering', 'economics'], effects: { production: 5 }, unlocks: ['factory', 'arsenal'], description: 'Mass production' },
    railroad:         { name: 'Railroad',          category: 'infrastructure', cost: 200, prereqs: ['industrialization'], effects: {}, unlocks: ['railroads', 'railwayGun'], description: 'Rail transport network' },
    tanks:            { name: 'Tanks',             category: 'military',   cost: 250, prereqs: ['industrialization'],  effects: {}, unlocks: ['lightTank'], description: 'Armored warfare' },
    advancedTraining: { name: 'Advanced Training', category: 'military',   cost: 200, prereqs: ['militaryScience'],    effects: {}, unlocks: ['eliteInfantry'], description: 'Elite forces' },
    ballistics:       { name: 'Ballistics',        category: 'military',   cost: 180, prereqs: ['artillery'],          effects: {}, unlocks: ['coastalGuns'], description: 'Advanced projectile science' },
    aviation:         { name: 'Aviation',          category: 'military',   cost: 250, prereqs: ['industrialization'],  effects: {}, unlocks: ['fighter', 'reconPlane', 'airBase'], description: 'Powered flight' },
    armorWarfare:     { name: 'Armor Warfare',     category: 'military',   cost: 300, prereqs: ['tanks'],              effects: {}, unlocks: ['mediumTank'], description: 'Combined arms tactics' },
    heavyArmor:       { name: 'Heavy Armor',       category: 'military',   cost: 400, prereqs: ['armorWarfare'],       effects: {}, unlocks: ['heavyTank'], description: 'Super-heavy vehicles' },
    rocketry:         { name: 'Rocketry',          category: 'military',   cost: 350, prereqs: ['ballistics', 'aviation'], effects: {}, unlocks: ['rocketArtillery'], description: 'Rocket-propelled munitions' },
    heavyOrdnance:    { name: 'Heavy Ordnance',    category: 'military',   cost: 400, prereqs: ['railroad', 'ballistics'], effects: {}, unlocks: ['railwayGun'], description: 'Massive siege weapons' },
    strategicBombing: { name: 'Strategic Bombing',  category: 'military',   cost: 350, prereqs: ['aviation'],          effects: {}, unlocks: ['bomber'], description: 'Long-range air strikes' },
    airTransport:     { name: 'Air Transport',     category: 'military',   cost: 250, prereqs: ['aviation'],           effects: {}, unlocks: ['transportAir'], description: 'Airborne logistics' },
    modernNavy:       { name: 'Modern Navy',       category: 'military',   cost: 300, prereqs: ['navigation', 'industrialization'], effects: {}, unlocks: ['cruiser'], description: 'Steel warships' },
    dreadnoughts:     { name: 'Dreadnoughts',      category: 'military',   cost: 450, prereqs: ['modernNavy'],        effects: {}, unlocks: ['battleship'], description: 'Capital ship design' },
    submarines:       { name: 'Submarines',         category: 'military',   cost: 300, prereqs: ['modernNavy'],        effects: {}, unlocks: ['submarine'], description: 'Underwater warfare' },
    carrierOps:       { name: 'Carrier Operations', category: 'military',  cost: 500, prereqs: ['dreadnoughts', 'aviation'], effects: {}, unlocks: ['carrier'], description: 'Carrier-based aviation' },
    radar:            { name: 'Radar',             category: 'science',    cost: 250, prereqs: ['aviation'],           effects: { visibility: 2 }, unlocks: ['radarStation'], description: 'Radio detection' },
    antiAir:          { name: 'Anti-Air Defense',   category: 'military',   cost: 200, prereqs: ['aviation'],          effects: {}, unlocks: ['antiAir', 'antiAirBattery'], description: 'Air defense systems' },
    amphibious:       { name: 'Amphibious Warfare', category: 'military',  cost: 250, prereqs: ['navigation', 'advancedTraining'], effects: {}, unlocks: ['marines'], description: 'Beach assault capability' },
    specialOps:       { name: 'Special Operations', category: 'military',  cost: 350, prereqs: ['advancedTraining'],   effects: {}, unlocks: ['commandos'], description: 'Covert military operations' },
    logistics:        { name: 'Logistics',          category: 'infrastructure', cost: 150, prereqs: ['engineering'],   effects: { supply: 2 }, unlocks: ['logisticsTruck'], description: 'Supply chain management' },
    fieldMedicine:    { name: 'Field Medicine',     category: 'science',   cost: 150, prereqs: ['education'],          effects: {}, unlocks: ['medic'], description: 'Battlefield medical care' },
    fortification:    { name: 'Fortification',     category: 'military',   cost: 200, prereqs: ['masonry', 'militaryScience'], effects: {}, unlocks: ['bunker', 'fort'], description: 'Advanced defensive works' },
    democracy:        { name: 'Democracy',         category: 'government', cost: 200, prereqs: ['education', 'economics'], effects: { happiness: 10, corruption: -0.1 }, unlocks: [], description: 'Representative government' },
    totalWar:         { name: 'Total War',         category: 'government', cost: 300, prereqs: ['industrialization', 'militaryScience'], effects: { warSupport: 15, production: 3 }, unlocks: [], description: 'Full national mobilization' },
    propaganda:       { name: 'Propaganda',        category: 'government', cost: 150, prereqs: ['writing'],            effects: { warSupport: 10 }, unlocks: [], description: 'Public opinion management' },
    espionage:        { name: 'Espionage',         category: 'government', cost: 200, prereqs: ['education'],          effects: {}, unlocks: [], description: 'Intelligence operations' }
};

export const WEATHER_TYPES = {
    clear:     { name: 'Clear',     movMod: 1.0,  visMod: 1.0,  combatMod: 1.0,  supplyMod: 1.0, icon: '☀', color: '#fff9c4' },
    rain:      { name: 'Rain',      movMod: 0.8,  visMod: 0.7,  combatMod: 0.9,  supplyMod: 0.9, icon: '\u{1F327}', color: '#90caf9' },
    snow:      { name: 'Snow',      movMod: 0.6,  visMod: 0.6,  combatMod: 0.8,  supplyMod: 0.7, icon: '\u{1F328}', color: '#e0e0e0' },
    fog:       { name: 'Fog',       movMod: 0.9,  visMod: 0.4,  combatMod: 0.85, supplyMod: 1.0, icon: '\u{1F32B}', color: '#cfd8dc' },
    sandstorm: { name: 'Sandstorm', movMod: 0.5,  visMod: 0.3,  combatMod: 0.7,  supplyMod: 0.6, icon: '\u{1F32A}', color: '#e8c96e' },
    storm:     { name: 'Storm',     movMod: 0.4,  visMod: 0.3,  combatMod: 0.6,  supplyMod: 0.5, icon: '⛈',    color: '#546e7a' }
};

export const AI_PERSONALITIES = {
    aggressive:   { name: 'Aggressive',   weights: { military: 0.4, expansion: 0.3, economy: 0.15, diplomacy: 0.05, research: 0.1 }, warThreshold: 0.3, peaceThreshold: 0.8 },
    expansionist: { name: 'Expansionist', weights: { military: 0.2, expansion: 0.4, economy: 0.2, diplomacy: 0.1, research: 0.1 }, warThreshold: 0.4, peaceThreshold: 0.6 },
    economic:     { name: 'Economic',     weights: { military: 0.1, expansion: 0.15, economy: 0.4, diplomacy: 0.2, research: 0.15 }, warThreshold: 0.6, peaceThreshold: 0.4 },
    defensive:    { name: 'Defensive',    weights: { military: 0.3, expansion: 0.1, economy: 0.25, diplomacy: 0.15, research: 0.2 }, warThreshold: 0.7, peaceThreshold: 0.3 },
    diplomatic:   { name: 'Diplomatic',   weights: { military: 0.1, expansion: 0.1, economy: 0.2, diplomacy: 0.4, research: 0.2 }, warThreshold: 0.8, peaceThreshold: 0.2 },
    balanced:     { name: 'Balanced',     weights: { military: 0.2, expansion: 0.2, economy: 0.2, diplomacy: 0.2, research: 0.2 }, warThreshold: 0.5, peaceThreshold: 0.5 }
};

export const DIPLOMACY_ACTIONS = {
    declareWar:       { name: 'Declare War',         relChange: -100, cost: { warSupport: 10 } },
    offerPeace:       { name: 'Offer Peace',         relChange: 20,   cost: {} },
    tradeAgreement:   { name: 'Trade Agreement',     relChange: 15,   cost: {} },
    alliance:         { name: 'Form Alliance',       relChange: 40,   cost: {} },
    nonAggression:    { name: 'Non-Aggression Pact', relChange: 25,   cost: {} },
    researchPact:     { name: 'Research Agreement',  relChange: 20,   cost: { gold: 100 } },
    demandTerritory:  { name: 'Demand Territory',    relChange: -30,  cost: {} },
    exchangeResource: { name: 'Exchange Resources',  relChange: 10,   cost: {} },
    espionage:        { name: 'Conduct Espionage',   relChange: -20,  cost: { gold: 150 } }
};

export const PLAYER_COLORS = [
    '#1565c0', '#c62828', '#2e7d32', '#f57f17',
    '#6a1b9a', '#00838f', '#d84315', '#455a64'
];

export const NATION_NAMES = [
    'Ironhaven Republic', 'Stormveld Empire', 'Ashenmoor Federation',
    'Crystalpeak Dominion', 'Greywood Alliance', 'Embercrest Kingdom',
    'Northwind Confederacy', 'Duskshore Sovereignty'
];

export const COMBAT = {
    flankingBonus: 0.2,
    encirclementThreshold: 4,
    encirclementBonus: 0.35,
    riverCrossingPenalty: 0.25,
    critChance: 0.1,
    critMultiplier: 1.5,
    suppressionThreshold: 0.3,
    experiencePerBattle: 10,
    moraleKillThreshold: 0.2,
    retreatMoraleThreshold: 20,
    zocMovePenalty: 2
};

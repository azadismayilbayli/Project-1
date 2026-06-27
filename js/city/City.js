import { CITY_LEVELS, BUILDINGS } from '../config.js';
import { getState, nextId } from '../core/GameState.js';
import { hexSpiral, hexKey } from '../utils.js';
import { getTile } from '../map/HexGrid.js';

const CITY_NAMES = [
    'Ironhold', 'Stormgate', 'Ashwick', 'Crystalford', 'Greymere',
    'Emberglen', 'Northwatch', 'Duskport', 'Silverpeak', 'Goldvale',
    'Thornfield', 'Ravencrest', 'Steelhaven', 'Frostburg', 'Sunridge',
    'Blackmoor', 'Whitecliff', 'Redstone', 'Blueharbor', 'Greendale',
    'Ironforge', 'Stormwind', 'Darkwater', 'Brightwall', 'Deepholm',
    'Highcastle', 'Lowmere', 'Farwatch', 'Oldtown', 'Newport',
    'Kingsbury', 'Queensport', 'Westmark', 'Eastgate', 'Southshore'
];
let cityNameIndex = 0;

export function createCity(owner, q, r, name) {
    const state = getState();
    const cityName = name || CITY_NAMES[cityNameIndex++ % CITY_NAMES.length];
    const city = {
        id: nextId(),
        name: cityName,
        owner,
        q, r,
        level: 0,
        population: 1,
        hp: 200,
        maxHp: 200,
        buildings: [],
        productionQueue: [],
        currentProduction: null,
        productionProgress: 0,
        food: 0,
        isCapital: state.cities.filter(c => c.owner === owner).length === 0,
        taxRate: 0.5,
        garrisonBonus: 0
    };
    state.cities.push(city);

    const tiles = hexSpiral({ q, r }, 2);
    for (const t of tiles) {
        const tile = getTile(t.q, t.r);
        if (tile && tile.owner === null) {
            tile.owner = owner;
        }
    }
    const centerTile = getTile(q, r);
    if (centerTile) centerTile.city = city.id;

    return city;
}

export function getCity(cityId) {
    return getState().cities.find(c => c.id === cityId);
}

export function getPlayerCities(playerId) {
    return getState().cities.filter(c => c.owner === playerId);
}

export function getCityLevel(city) {
    return CITY_LEVELS[city.level];
}

export function getCityIncome(city) {
    const level = CITY_LEVELS[city.level];
    const tile = getTile(city.q, city.r);
    let gold = (tile ? tile.terrain.gold : 0) * level.goldMult + city.population * 2;
    let food = (tile ? tile.terrain.food : 0) * level.foodMult + city.population;
    let production = (tile ? tile.terrain.production : 0) * level.industryMult + city.population;
    let science = city.population * level.scienceMult * 0.5;

    const extras = { oil: 0, coal: 0, iron: 0, timber: 0, stone: 0, rubber: 0, rareEarth: 0 };

    for (const b of city.buildings) {
        const bDef = BUILDINGS[b];
        if (!bDef) continue;
        if (bDef.effects.gold) gold += bDef.effects.gold;
        if (bDef.effects.food) food += bDef.effects.food;
        if (bDef.effects.production) production += bDef.effects.production;
        if (bDef.effects.science) science += bDef.effects.science;
        if (bDef.effects.iron) extras.iron += bDef.effects.iron;
    }

    const tiles = hexSpiral({ q: city.q, r: city.r }, 2);
    for (const t of tiles) {
        const tt = getTile(t.q, t.r);
        if (tt && tt.owner === city.owner && tt.resource) {
            if (extras[tt.resource] !== undefined) extras[tt.resource] += 1;
        }
    }

    return { gold: Math.floor(gold), food: Math.floor(food), production: Math.floor(production), science: Math.floor(science), ...extras };
}

export function processCityTurn(city) {
    const income = getCityIncome(city);
    city.food += income.food;

    const foodNeeded = city.population * 3;
    if (city.food >= foodNeeded) {
        city.food -= foodNeeded;
        city.population++;
        checkLevelUp(city);
    }

    if (city.currentProduction) {
        city.productionProgress += income.production;
        const bDef = BUILDINGS[city.currentProduction];
        const uType = city.currentProduction.startsWith('unit:') ? true : false;
        const cost = uType ? 50 : (bDef ? bDef.cost.production : 50);

        if (city.productionProgress >= cost) {
            city.productionProgress = 0;
            if (uType) {
                const unitKey = city.currentProduction.replace('unit:', '');
                city.currentProduction = city.productionQueue.shift() || null;
                return { type: 'unit', unitKey, cityId: city.id };
            } else {
                if (!city.buildings.includes(city.currentProduction)) {
                    city.buildings.push(city.currentProduction);
                }
                city.currentProduction = city.productionQueue.shift() || null;
            }
        }
    }

    if (city.hp < city.maxHp) {
        city.hp = Math.min(city.maxHp, city.hp + 10);
    }

    return null;
}

function checkLevelUp(city) {
    const nextLevel = city.level + 1;
    if (nextLevel < CITY_LEVELS.length && city.population >= CITY_LEVELS[nextLevel].population) {
        city.level = nextLevel;
        city.maxHp += 50;
        city.hp = city.maxHp;
    }
}

export function startProduction(city, itemKey) {
    if (city.currentProduction) {
        city.productionQueue.push(itemKey);
    } else {
        city.currentProduction = itemKey;
        city.productionProgress = 0;
    }
}

export function captureCity(city, newOwner) {
    const state = getState();
    const oldOwner = city.owner;
    city.owner = newOwner;
    city.hp = Math.floor(city.maxHp * 0.5);
    city.population = Math.max(1, Math.floor(city.population * 0.7));
    city.productionQueue = [];
    city.currentProduction = null;
    city.productionProgress = 0;

    const tiles = hexSpiral({ q: city.q, r: city.r }, 2);
    for (const t of tiles) {
        const tile = getTile(t.q, t.r);
        if (tile && tile.owner === oldOwner) tile.owner = newOwner;
    }
}

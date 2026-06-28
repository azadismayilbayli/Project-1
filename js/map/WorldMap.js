// A stylized 1850 world map rendered onto the hex grid.
// Continents are composed from overlapping ellipses placed at their real-world
// relative positions (equirectangular projection on a 64x40 grid), with mountain
// ranges, deserts, jungles and ice assigned to match actual geography. Real
// historical great powers are seeded at their true capitals.

import { TERRAIN } from '../config.js';
import { hexKey, hexNeighbors, seededRandom } from '../utils.js';
import { createTile } from './Tile.js';
import { setTile, getTile } from './HexGrid.js';

export const WORLD_WIDTH = 64;
export const WORLD_HEIGHT = 40;

// Base landmasses: {cx, cy, rx, ry, t}
const LANDMASSES = [
    // North America
    { cx: 7,  cy: 7,  rx: 4,  ry: 3,   t: 'TUNDRA' },   // Alaska
    { cx: 16, cy: 9,  rx: 8,  ry: 4,   t: 'FOREST' },   // Canada
    { cx: 16, cy: 6,  rx: 7,  ry: 2,   t: 'TUNDRA' },   // Northern Canada
    { cx: 16, cy: 14, rx: 7,  ry: 3,   t: 'PLAINS' },   // United States
    { cx: 14, cy: 18, rx: 2.5, ry: 2.5, t: 'DESERT' },  // Mexico
    { cx: 16, cy: 19, rx: 1.5, ry: 2,  t: 'FOREST' },   // Central America
    // Greenland
    { cx: 27, cy: 6,  rx: 2.5, ry: 3,  t: 'SNOW' },
    // South America
    { cx: 23, cy: 23, rx: 5,  ry: 4,   t: 'FOREST' },   // Amazon basin
    { cx: 25, cy: 25, rx: 3,  ry: 3,   t: 'FOREST' },   // Brazil
    { cx: 22, cy: 30, rx: 3,  ry: 4,   t: 'PLAINS' },   // Argentina
    // Europe
    { cx: 33, cy: 10, rx: 4,  ry: 3,   t: 'FOREST' },   // Continental Europe
    { cx: 33, cy: 6,  rx: 2,  ry: 3,   t: 'TUNDRA' },   // Scandinavia
    { cx: 30, cy: 13, rx: 2,  ry: 2,   t: 'PLAINS' },   // Iberia
    { cx: 30, cy: 9,  rx: 1.3, ry: 1.6, t: 'PLAINS' },  // British Isles
    { cx: 37, cy: 13, rx: 3,  ry: 1.5, t: 'PLAINS' },   // Anatolia
    // Africa
    { cx: 34, cy: 17, rx: 7,  ry: 3,   t: 'DESERT' },   // Sahara
    { cx: 31, cy: 20, rx: 3,  ry: 2,   t: 'FOREST' },   // West Africa
    { cx: 35, cy: 22, rx: 4,  ry: 3,   t: 'FOREST' },   // Congo
    { cx: 38, cy: 21, rx: 2,  ry: 4,   t: 'PLAINS' },   // East Africa
    { cx: 35, cy: 27, rx: 3,  ry: 3,   t: 'PLAINS' },   // Southern Africa
    // Middle East
    { cx: 38, cy: 15, rx: 3,  ry: 2,   t: 'DESERT' },
    // Asia
    { cx: 42, cy: 8,  rx: 7,  ry: 3,   t: 'FOREST' },   // West Siberia
    { cx: 54, cy: 8,  rx: 9,  ry: 4,   t: 'TUNDRA' },   // East Siberia
    { cx: 48, cy: 5,  rx: 12, ry: 2,   t: 'TUNDRA' },   // Arctic Siberia
    { cx: 43, cy: 13, rx: 5,  ry: 2,   t: 'PLAINS' },   // Central Asia
    { cx: 44, cy: 17, rx: 3,  ry: 3,   t: 'FOREST' },   // India
    { cx: 52, cy: 14, rx: 5,  ry: 3,   t: 'PLAINS' },   // China
    { cx: 50, cy: 19, rx: 2,  ry: 2,   t: 'FOREST' },   // Indochina
    { cx: 52, cy: 21, rx: 4,  ry: 1.5, t: 'FOREST' },   // Indonesia
    { cx: 57, cy: 12, rx: 1,  ry: 2,   t: 'FOREST' },   // Japan
    // Australia
    { cx: 55, cy: 28, rx: 5,  ry: 2.5, t: 'DESERT' },
    { cx: 58, cy: 28, rx: 1.5, ry: 2,  t: 'PLAINS' },   // East coast
    { cx: 54, cy: 26, rx: 2,  ry: 1,   t: 'PLAINS' }    // North coast
];

// Terrain features that override base land (mountains, deserts, hills).
const FEATURES = [
    { cx: 11, cy: 13, rx: 1.5, ry: 5,   t: 'MOUNTAINS' }, // Rockies
    { cx: 19, cy: 14, rx: 1,  ry: 3,    t: 'HILLS' },     // Appalachians
    { cx: 20, cy: 26, rx: 1,  ry: 8,    t: 'MOUNTAINS' }, // Andes
    { cx: 34, cy: 12, rx: 2,  ry: 0.8,  t: 'MOUNTAINS' }, // Alps
    { cx: 38, cy: 12, rx: 2,  ry: 0.8,  t: 'MOUNTAINS' }, // Caucasus
    { cx: 46, cy: 14, rx: 4,  ry: 1,    t: 'MOUNTAINS' }, // Himalayas
    { cx: 41, cy: 9,  rx: 0.8, ry: 4,   t: 'HILLS' },     // Urals
    { cx: 32, cy: 15, rx: 2,  ry: 0.6,  t: 'MOUNTAINS' }, // Atlas
    { cx: 38, cy: 19, rx: 1.5, ry: 1.5, t: 'HILLS' },     // Ethiopian highlands
    { cx: 49, cy: 11, rx: 3,  ry: 1,    t: 'DESERT' },    // Gobi
    { cx: 32, cy: 6,  rx: 0.8, ry: 2,   t: 'MOUNTAINS' }  // Scandinavian mountains
];

// Famous rivers (cells forced to RIVER): [ [q,r], ... ]
const RIVERS = [
    [35, 14], [35, 15], [35, 16], [35, 17],          // Nile
    [21, 23], [22, 23], [23, 23], [24, 23],          // Amazon
    [16, 11], [16, 12], [16, 13],                    // Mississippi
    [34, 9],  [34, 10]                               // Rhine/Danube hint
];

function inEllipse(q, r, e) {
    const dx = (q - e.cx) / e.rx;
    const dy = (r - e.cy) / e.ry;
    return dx * dx + dy * dy <= 1;
}

function terrainAt(q, r) {
    // Antarctica
    if (r >= WORLD_HEIGHT - 2) return 'SNOW';
    // Arctic Ocean cap
    if (r <= 0) return null;

    let t = null;
    for (const e of LANDMASSES) {
        if (inEllipse(q, r, e)) t = e.t;
    }
    if (!t) return null; // ocean

    for (const f of FEATURES) {
        if (inEllipse(q, r, f)) t = f.t;
    }

    // High-latitude bleaching
    if (r <= 3 && t !== 'MOUNTAINS') t = 'SNOW';
    else if (r <= 5 && (t === 'PLAINS' || t === 'FOREST')) t = 'TUNDRA';

    return t;
}

export function buildWorldMap(seed = 1850) {
    const rng = seededRandom(seed);

    // First pass: land & ocean
    for (let r = 0; r < WORLD_HEIGHT; r++) {
        for (let q = 0; q < WORLD_WIDTH; q++) {
            const key = terrainAt(q, r);
            const terrainKey = key || 'OCEAN';
            const tile = createTile(q, r, TERRAIN[terrainKey].id);

            // Resources on land
            if (key && TERRAIN[terrainKey].passable && !TERRAIN[terrainKey].naval) {
                const roll = rng();
                if (roll < 0.025) tile.resource = 'oil';
                else if (roll < 0.05) tile.resource = 'iron';
                else if (roll < 0.07) tile.resource = 'coal';
                else if (roll < 0.085) tile.resource = 'rareEarth';
                else if (roll < 0.11) tile.resource = 'timber';
                else if (roll < 0.13) tile.resource = 'stone';
                else if (roll < 0.145) tile.resource = 'rubber';
            }
            setTile(q, r, tile);
        }
    }

    // Rivers
    for (const [q, r] of RIVERS) {
        const tile = getTile(q, r);
        if (tile && tile.terrain.passable && !tile.terrain.naval) {
            setTile(q, r, createTile(q, r, TERRAIN.RIVER.id));
        }
    }

    // Coastlines: ocean adjacent to land becomes coast
    for (let r = 0; r < WORLD_HEIGHT; r++) {
        for (let q = 0; q < WORLD_WIDTH; q++) {
            const tile = getTile(q, r);
            if (!tile || tile.terrain.id !== TERRAIN.OCEAN.id) continue;
            const nearLand = hexNeighbors(q, r).some(n => {
                const nt = getTile(n.q, n.r);
                return nt && nt.terrain.passable && !nt.terrain.naval;
            });
            if (nearLand) tile.terrain = TERRAIN.COAST;
        }
    }
}

// Find nearest passable land to a coordinate (forces plains if none nearby).
export function snapToLand(q, r) {
    const t = getTile(q, r);
    if (t && t.terrain.passable && !t.terrain.naval) return { q, r };
    for (let radius = 1; radius <= 4; radius++) {
        for (let dq = -radius; dq <= radius; dq++) {
            for (let dr = -radius; dr <= radius; dr++) {
                const nt = getTile(q + dq, r + dr);
                if (nt && nt.terrain.passable && !nt.terrain.naval) {
                    return { q: q + dq, r: r + dr };
                }
            }
        }
    }
    // Force land
    const tile = getTile(q, r);
    if (tile) tile.terrain = TERRAIN.PLAINS;
    return { q, r };
}

export function findLandNeighbors(q, r, count) {
    const results = [];
    for (const n of hexNeighbors(q, r)) {
        const t = getTile(n.q, n.r);
        if (t && t.terrain.passable && !t.terrain.naval) results.push(n);
        if (results.length >= count) break;
    }
    while (results.length < count) results.push({ q, r });
    return results;
}

// The great powers of 1850, ordered for global spread (first ones are far apart).
export const NATIONS = [
    {
        key: 'usa', name: 'United States', color: '#2e5cb8', capitalName: 'Washington',
        capital: { q: 17, r: 14 },
        cities: [{ name: 'New York', q: 18, r: 13 }, { name: 'New Orleans', q: 15, r: 16 }]
    },
    {
        key: 'britain', name: 'British Empire', color: '#b23b3b', capitalName: 'London',
        capital: { q: 30, r: 9 },
        cities: [{ name: 'Manchester', q: 30, r: 8 }, { name: 'Calcutta', q: 45, r: 17 }]
    },
    {
        key: 'russia', name: 'Russian Empire', color: '#3a7d44', capitalName: 'St. Petersburg',
        capital: { q: 37, r: 7 },
        cities: [{ name: 'Moscow', q: 39, r: 8 }, { name: 'Vladivostok', q: 58, r: 11 }]
    },
    {
        key: 'qing', name: 'Qing China', color: '#d4a72c', capitalName: 'Beijing',
        capital: { q: 52, r: 12 },
        cities: [{ name: 'Nanjing', q: 53, r: 14 }, { name: 'Guangzhou', q: 51, r: 16 }]
    },
    {
        key: 'ottoman', name: 'Ottoman Empire', color: '#1f8a70', capitalName: 'Constantinople',
        capital: { q: 36, r: 13 },
        cities: [{ name: 'Cairo', q: 35, r: 16 }, { name: 'Baghdad', q: 39, r: 15 }]
    },
    {
        key: 'france', name: 'French Empire', color: '#7b4fa3', capitalName: 'Paris',
        capital: { q: 33, r: 11 },
        cities: [{ name: 'Marseille', q: 33, r: 12 }, { name: 'Algiers', q: 33, r: 15 }]
    },
    {
        key: 'austria', name: 'Austrian Empire', color: '#d9d2c0', capitalName: 'Vienna',
        capital: { q: 35, r: 11 },
        cities: [{ name: 'Budapest', q: 36, r: 11 }, { name: 'Milan', q: 33, r: 12 }]
    },
    {
        key: 'prussia', name: 'Kingdom of Prussia', color: '#4a4a55', capitalName: 'Berlin',
        capital: { q: 34, r: 9 },
        cities: [{ name: 'Cologne', q: 32, r: 10 }, { name: 'Konigsberg', q: 36, r: 8 }]
    }
];

export const NATIONS_BY_KEY = Object.fromEntries(NATIONS.map(n => [n.key, n]));

// Builds the playable world from real rasterized geography (WorldData.js),
// then seeds the great powers of 1850 at their true capitals (by lon/lat).

import { TERRAIN } from '../config.js';
import { hexNeighbors } from '../utils.js';
import { createTile } from './Tile.js';
import { setTile, getTile } from './HexGrid.js';
import { W, H, TERRAIN_ROWS, OWNER_ROWS } from './WorldData.js';

export const WORLD_WIDTH = W;
export const WORLD_HEIGHT = H;

const CHAR_TO_TERRAIN = {
    p: 'PLAINS', f: 'FOREST', m: 'MOUNTAINS', h: 'HILLS', d: 'DESERT',
    s: 'SWAMP', r: 'RIVER', c: 'COAST', '~': 'OCEAN', n: 'SNOW', t: 'TUNDRA'
};

const OWNER_CHAR_TO_KEY = {
    U: 'usa', B: 'britain', R: 'russia', Q: 'qing',
    O: 'ottoman', F: 'france', A: 'austria', P: 'prussia'
};

// Convert real lon/lat to grid coordinates.
export function lonLatToGrid(lon, lat) {
    const col = Math.round((lon + 180) / 360 * W - 0.5);
    const row = Math.round((90 - lat) / 180 * H - 0.5);
    return { q: Math.max(0, Math.min(W - 1, col)), r: Math.max(0, Math.min(H - 1, row)) };
}

let seed = 1850;
function rng() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

export function buildWorldMap() {
    seed = 1850;
    for (let r = 0; r < H; r++) {
        for (let q = 0; q < W; q++) {
            const tchar = TERRAIN_ROWS[r][q];
            const terrainKey = CHAR_TO_TERRAIN[tchar] || 'OCEAN';
            const tile = createTile(q, r, TERRAIN[terrainKey].id);

            const ochar = OWNER_ROWS[r][q];
            tile.dataOwner = OWNER_CHAR_TO_KEY[ochar] || null;

            if (TERRAIN[terrainKey].passable && !TERRAIN[terrainKey].naval) {
                const roll = rng();
                if (roll < 0.022) tile.resource = 'oil';
                else if (roll < 0.044) tile.resource = 'iron';
                else if (roll < 0.062) tile.resource = 'coal';
                else if (roll < 0.076) tile.resource = 'rareEarth';
                else if (roll < 0.1) tile.resource = 'timber';
                else if (roll < 0.118) tile.resource = 'stone';
            }
            setTile(q, r, tile);
        }
    }

    // Coastlines: ocean next to land becomes coast
    for (let r = 0; r < H; r++) {
        for (let q = 0; q < W; q++) {
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

// Assign data ownership to active players; clear ownership of absent powers.
export function applyOwnership(activeKeys, keyToPlayerId) {
    for (let r = 0; r < H; r++) {
        for (let q = 0; q < W; q++) {
            const tile = getTile(q, r);
            if (!tile || !tile.dataOwner) continue;
            if (activeKeys.includes(tile.dataOwner)) {
                tile.owner = keyToPlayerId[tile.dataOwner];
            }
        }
    }
}

export function snapToLand(q, r) {
    const t = getTile(q, r);
    if (t && t.terrain.passable && !t.terrain.naval) return { q, r };
    for (let radius = 1; radius <= 5; radius++) {
        for (let dq = -radius; dq <= radius; dq++) {
            for (let dr = -radius; dr <= radius; dr++) {
                const nt = getTile(q + dq, r + dr);
                if (nt && nt.terrain.passable && !nt.terrain.naval) return { q: q + dq, r: r + dr };
            }
        }
    }
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

// Great powers of 1850 with real capital/city coordinates (lon, lat).
const RAW_NATIONS = [
    { key: 'usa', name: 'United States', color: '#2e5cb8', capitalName: 'Washington',
      capital: [-77, 38.9], cities: [['New York', -74, 40.7], ['New Orleans', -90, 30]] },
    { key: 'britain', name: 'British Empire', color: '#b23b3b', capitalName: 'London',
      capital: [-0.1, 51.5], cities: [['Manchester', -2.2, 53.5], ['Calcutta', 88.4, 22.6]] },
    { key: 'russia', name: 'Russian Empire', color: '#3a7d44', capitalName: 'St. Petersburg',
      capital: [30.3, 59.9], cities: [['Moscow', 37.6, 55.8], ['Vladivostok', 131.9, 43.1]] },
    { key: 'qing', name: 'Qing China', color: '#d4a72c', capitalName: 'Beijing',
      capital: [116.4, 39.9], cities: [['Nanjing', 118.8, 32], ['Guangzhou', 113.3, 23.1]] },
    { key: 'ottoman', name: 'Ottoman Empire', color: '#1f8a70', capitalName: 'Constantinople',
      capital: [29, 41], cities: [['Cairo', 31.2, 30], ['Baghdad', 44.4, 33.3]] },
    { key: 'france', name: 'French Empire', color: '#7b4fa3', capitalName: 'Paris',
      capital: [2.3, 48.9], cities: [['Marseille', 5.4, 43.3], ['Algiers', 3, 36.8]] },
    { key: 'austria', name: 'Austrian Empire', color: '#d9d2c0', capitalName: 'Vienna',
      capital: [16.4, 48.2], cities: [['Budapest', 19, 47.5], ['Milan', 9.2, 45.5]] },
    { key: 'prussia', name: 'Kingdom of Prussia', color: '#6a6a78', capitalName: 'Berlin',
      capital: [13.4, 52.5], cities: [['Cologne', 6.9, 50.9], ['Konigsberg', 20.5, 54.7]] }
];

export const NATIONS = RAW_NATIONS.map(n => ({
    key: n.key, name: n.name, color: n.color, capitalName: n.capitalName,
    capital: lonLatToGrid(n.capital[0], n.capital[1]),
    cities: n.cities.map(c => ({ name: c[0], ...lonLatToGrid(c[1], c[2]) }))
}));

export const NATIONS_BY_KEY = Object.fromEntries(NATIONS.map(n => [n.key, n]));

// Decorative real cities (lon, lat) -> grid, for an authentic populated map.
const RAW_TOWNS = [
    ['Madrid', -3.7, 40.4], ['Lisbon', -9.1, 38.7], ['Rome', 12.5, 41.9],
    ['Amsterdam', 4.9, 52.4], ['Stockholm', 18.1, 59.3], ['Warsaw', 21, 52.2],
    ['Kiev', 30.5, 50.5], ['Athens', 23.7, 38], ['Dublin', -6.3, 53.3],
    ['Naples', 14.3, 40.9], ['Copenhagen', 12.6, 55.7], ['Rio de Janeiro', -43.2, -22.9],
    ['Mexico City', -99.1, 19.4], ['Lima', -77, -12], ['Buenos Aires', -58.4, -34.6],
    ['Quebec', -71.2, 46.8], ['San Francisco', -122.4, 37.8], ['Chicago', -87.6, 41.9],
    ['Havana', -82.4, 23.1], ['Bogota', -74.1, 4.7], ['Santiago', -70.7, -33.4],
    ['Tripoli', 13.2, 32.9], ['Timbuktu', -3, 16.8], ['Cape Town', 18.4, -33.9],
    ['Zanzibar', 39.2, -6.2], ['Lagos', 3.4, 6.5], ['Addis Ababa', 38.7, 9],
    ['Tehran', 51.4, 35.7], ['Delhi', 77.2, 28.6], ['Bombay', 72.8, 19],
    ['Tokyo', 139.7, 35.7], ['Shanghai', 121.5, 31.2], ['Bangkok', 100.5, 13.8],
    ['Manila', 121, 14.6], ['Tashkent', 69.2, 41.3], ['Kabul', 69.2, 34.5],
    ['Singapore', 103.8, 1.4], ['Sydney', 151.2, -33.9], ['Perth', 115.9, -32]
];
export const TOWNS = RAW_TOWNS.map(t => ({ name: t[0], ...lonLatToGrid(t[1], t[2]) }));

const RAW_SEAS = [
    ['ATLANTIC OCEAN', -40, 20, 18], ['PACIFIC OCEAN', -150, 10, 18],
    ['PACIFIC OCEAN', 170, 5, 18], ['INDIAN OCEAN', 80, -25, 16],
    ['ARCTIC OCEAN', 0, 84, 14], ['SOUTHERN OCEAN', 20, -62, 14],
    ['Mediterranean Sea', 17, 35, 9], ['Black Sea', 35, 43, 8],
    ['Caribbean Sea', -75, 15, 9], ['Bay of Bengal', 89, 13, 8],
    ['North Sea', 3, 56, 8], ['Arabian Sea', 63, 14, 8]
];
export const SEA_LABELS = RAW_SEAS.map(s => ({ name: s[0], ...lonLatToGrid(s[1], s[2]), size: s[3] }));

const RAW_REGIONS = [
    ['NORTH AMERICA', -100, 45], ['SOUTH AMERICA', -60, -15], ['EUROPE', 15, 52],
    ['AFRICA', 20, 5], ['ASIA', 90, 50], ['AUSTRALIA', 134, -25]
];
export const REGION_LABELS = RAW_REGIONS.map(s => ({ name: s[0], ...lonLatToGrid(s[1], s[2]) }));

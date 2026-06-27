import { TERRAIN } from '../config.js';
import { hexKey, generateNoise, seededRandom } from '../utils.js';
import { createTile } from './Tile.js';
import { setTile } from './HexGrid.js';
import { getState } from '../core/GameState.js';

export function generateMap(width, height, seed = Date.now()) {
    const elevation = generateNoise(width, height, seed, 0.08);
    const moisture = generateNoise(width, height, seed + 1000, 0.06);
    const temperature = generateNoise(width, height, seed + 2000, 0.05);
    const rng = seededRandom(seed + 3000);

    for (let r = 0; r < height; r++) {
        for (let q = 0; q < width; q++) {
            const e = elevation[r][q];
            const m = moisture[r][q];
            const latFactor = Math.abs(r - height / 2) / (height / 2);
            const t = temperature[r][q] * (1 - latFactor * 0.8);

            let terrain;
            if (e < 0.2) {
                terrain = TERRAIN.OCEAN;
            } else if (e < 0.28) {
                terrain = TERRAIN.COAST;
            } else if (e > 0.82) {
                terrain = t < 0.3 ? TERRAIN.SNOW : TERRAIN.MOUNTAINS;
            } else if (e > 0.68) {
                terrain = TERRAIN.HILLS;
            } else {
                if (t < 0.2) {
                    terrain = e > 0.5 ? TERRAIN.SNOW : TERRAIN.TUNDRA;
                } else if (t < 0.35 && m > 0.5) {
                    terrain = TERRAIN.TUNDRA;
                } else if (m > 0.7) {
                    terrain = TERRAIN.SWAMP;
                } else if (m > 0.5) {
                    terrain = TERRAIN.FOREST;
                } else if (m < 0.25 && t > 0.6) {
                    terrain = TERRAIN.DESERT;
                } else {
                    terrain = TERRAIN.PLAINS;
                }
            }

            if (terrain.passable && rng() < 0.03 && e > 0.3 && e < 0.7) {
                terrain = TERRAIN.RIVER;
            }

            const tile = createTile(q, r, terrain.id);

            if (terrain.passable && !terrain.naval) {
                const resRoll = rng();
                if (resRoll < 0.03) tile.resource = 'oil';
                else if (resRoll < 0.06) tile.resource = 'iron';
                else if (resRoll < 0.08) tile.resource = 'coal';
                else if (resRoll < 0.1) tile.resource = 'rareEarth';
                else if (resRoll < 0.13 && m > 0.4) tile.resource = 'timber';
                else if (resRoll < 0.15 && e > 0.5) tile.resource = 'stone';
                else if (resRoll < 0.17 && m > 0.6) tile.resource = 'rubber';
            }

            setTile(q, r, tile);
        }
    }

    return findStartPositions(width, height, seed);
}

function findStartPositions(width, height, seed) {
    const rng = seededRandom(seed + 5000);
    const positions = [];
    const minDist = Math.min(width, height) / 4;
    const candidates = [];
    const state = getState();

    for (let r = 3; r < height - 3; r++) {
        for (let q = 3; q < width - 3; q++) {
            const tile = state.tiles[hexKey(q, r)];
            if (tile && tile.terrain.passable && !tile.terrain.naval) {
                candidates.push({ q, r });
            }
        }
    }

    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    for (const c of candidates) {
        if (positions.length >= 8) break;
        let tooClose = false;
        for (const p of positions) {
            const dist = Math.sqrt((c.q - p.q) ** 2 + (c.r - p.r) ** 2);
            if (dist < minDist) { tooClose = true; break; }
        }
        if (!tooClose) positions.push(c);
    }

    return positions;
}

import { hexKey, hexNeighbors } from '../utils.js';
import { getState } from '../core/GameState.js';

export function getTile(q, r) {
    return getState().tiles[hexKey(q, r)] || null;
}

export function setTile(q, r, tile) {
    getState().tiles[hexKey(q, r)] = tile;
}

export function getAllTiles() {
    return Object.values(getState().tiles);
}

export function getNeighborTiles(q, r) {
    return hexNeighbors(q, r)
        .map(n => getTile(n.q, n.r))
        .filter(t => t !== null);
}

export function isValidHex(q, r) {
    return getTile(q, r) !== null;
}

export function getUnitsAt(q, r) {
    return getState().units.filter(u => u.q === q && u.r === r && u.hp > 0);
}

export function getCityAt(q, r) {
    return getState().cities.find(c => c.q === q && c.r === r);
}

export function getTilesInRange(q, r, range) {
    const results = [];
    for (let dq = -range; dq <= range; dq++) {
        for (let dr = Math.max(-range, -dq - range); dr <= Math.min(range, -dq + range); dr++) {
            const tile = getTile(q + dq, r + dr);
            if (tile) results.push(tile);
        }
    }
    return results;
}

import { getState } from '../core/GameState.js';
import { hexKey, hexSpiral } from '../utils.js';

export function updateVisibility(playerId) {
    const state = getState();
    const player = state.players[playerId];

    player.visibleTiles = new Set();

    const units = state.units.filter(u => u.owner === playerId && u.hp > 0);
    for (const unit of units) {
        const range = unit.type.category === 'air' ? 4 : (unit.type.range > 1 ? 3 : 2);
        const tiles = hexSpiral({ q: unit.q, r: unit.r }, range);
        for (const t of tiles) {
            const k = hexKey(t.q, t.r);
            player.visibleTiles.add(k);
            player.exploredTiles.add(k);
        }
    }

    const cities = state.cities.filter(c => c.owner === playerId);
    for (const city of cities) {
        const range = 3 + (city.buildings.includes('radarStation') ? 3 : 0);
        const tiles = hexSpiral({ q: city.q, r: city.r }, range);
        for (const t of tiles) {
            const k = hexKey(t.q, t.r);
            player.visibleTiles.add(k);
            player.exploredTiles.add(k);
        }
    }
}

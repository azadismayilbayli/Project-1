import { getState } from '../core/GameState.js';
import { getPlayerCities } from '../city/City.js';
import { hexKey, hexNeighbors, hexDistance } from '../utils.js';
import { getTile } from '../map/HexGrid.js';

export function calculateSupply(playerId) {
    const state = getState();
    const cities = getPlayerCities(playerId);
    const supplyMap = {};
    const maxRange = 10;

    for (const city of cities) {
        const queue = [{ q: city.q, r: city.r, supply: 100 }];
        const visited = new Set();

        while (queue.length > 0) {
            const current = queue.shift();
            const key = hexKey(current.q, current.r);
            if (visited.has(key)) continue;
            visited.add(key);

            const existing = supplyMap[key] || 0;
            supplyMap[key] = Math.max(existing, current.supply);

            if (current.supply <= 10) continue;

            for (const n of hexNeighbors(current.q, current.r)) {
                const tile = getTile(n.q, n.r);
                if (!tile || !tile.terrain.passable) continue;
                if (tile.terrain.naval) continue;

                const nKey = hexKey(n.q, n.r);
                if (visited.has(nKey)) continue;

                let reduction = 10;
                if (tile.terrain.name === 'Mountains') reduction = 20;
                if (tile.terrain.name === 'Swamp') reduction = 15;

                const hasRoad = tile.terrain.name === 'Road';
                const hasRailroad = state.cities.some(c =>
                    c.owner === playerId && c.buildings.includes('railroads') &&
                    hexDistance({ q: c.q, r: c.r }, n) <= 3
                );

                if (hasRoad) reduction = 5;
                if (hasRailroad) reduction = 3;

                const enemyPresent = state.units.some(u => u.q === n.q && u.r === n.r && u.owner !== playerId && u.hp > 0);
                if (enemyPresent) reduction = 50;

                const newSupply = current.supply - reduction;
                if (newSupply > (supplyMap[nKey] || 0)) {
                    queue.push({ q: n.q, r: n.r, supply: newSupply });
                }
            }
        }
    }

    return supplyMap;
}

export function updateUnitSupply(playerId) {
    const state = getState();
    const supplyMap = calculateSupply(playerId);
    const units = state.units.filter(u => u.owner === playerId && u.hp > 0);

    for (const unit of units) {
        const key = hexKey(unit.q, unit.r);
        const tileSupply = supplyMap[key] || 0;
        unit.supply = tileSupply;

        if (unit.supply < 20) {
            unit.morale = Math.max(0, unit.morale - 10);
            unit.movementLeft = Math.max(0, unit.movementLeft - 1);
        } else if (unit.supply < 50) {
            unit.morale = Math.max(0, unit.morale - 3);
        } else {
            unit.morale = Math.min(100, unit.morale + 2);
        }
    }
}

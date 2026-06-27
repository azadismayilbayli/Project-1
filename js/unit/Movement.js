import { hexNeighbors, hexKey, PriorityQueue, hexDistance } from '../utils.js';
import { getTile } from '../map/HexGrid.js';
import { getState } from '../core/GameState.js';
import { COMBAT } from '../config.js';

export function getMovementCost(fromQ, fromR, toQ, toR, unit) {
    const tile = getTile(toQ, toR);
    if (!tile) return Infinity;

    const isNaval = unit.type.category === 'naval';
    const isAir = unit.type.category === 'air';

    if (isAir) return 1;

    if (isNaval) {
        if (!tile.terrain.naval) return Infinity;
        return tile.terrain.moveCost;
    }

    if (!tile.terrain.passable) return Infinity;
    if (tile.terrain.naval && !unit.embarked) return Infinity;

    let cost = tile.terrain.moveCost;

    const state = getState();
    const enemyUnits = state.units.filter(u => u.q === toQ && u.r === toR && u.owner !== unit.owner && u.hp > 0);
    if (enemyUnits.length > 0) return Infinity;

    const neighbors = hexNeighbors(toQ, toR);
    for (const n of neighbors) {
        const nearbyEnemy = state.units.find(u => u.q === n.q && u.r === n.r && u.owner !== unit.owner && u.hp > 0 && u.type.category !== 'air');
        if (nearbyEnemy) {
            cost += COMBAT.zocMovePenalty;
            break;
        }
    }

    return cost;
}

export function findPath(unit, targetQ, targetR) {
    const start = hexKey(unit.q, unit.r);
    const goal = hexKey(targetQ, targetR);
    if (start === goal) return [];

    const frontier = new PriorityQueue();
    frontier.push(start, 0);
    const cameFrom = { [start]: null };
    const costSoFar = { [start]: 0 };

    while (frontier.size > 0) {
        const currentKey = frontier.pop();
        if (currentKey === goal) break;

        const [cq, cr] = currentKey.split(',').map(Number);
        const neighbors = hexNeighbors(cq, cr);

        for (const n of neighbors) {
            const nKey = hexKey(n.q, n.r);
            const moveCost = getMovementCost(cq, cr, n.q, n.r, unit);
            if (moveCost === Infinity) continue;

            const newCost = costSoFar[currentKey] + moveCost;
            if (!(nKey in costSoFar) || newCost < costSoFar[nKey]) {
                costSoFar[nKey] = newCost;
                const priority = newCost + hexDistance({ q: n.q, r: n.r }, { q: targetQ, r: targetR });
                frontier.push(nKey, priority);
                cameFrom[nKey] = currentKey;
            }
        }
    }

    if (!(goal in cameFrom)) return null;

    const path = [];
    let current = goal;
    while (current !== start) {
        const [q, r] = current.split(',').map(Number);
        path.unshift({ q, r, cost: costSoFar[current] });
        current = cameFrom[current];
    }
    path.unshift({ q: unit.q, r: unit.r, cost: 0 });

    return path;
}

export function getReachableTiles(unit) {
    const start = hexKey(unit.q, unit.r);
    const frontier = new PriorityQueue();
    frontier.push(start, 0);
    const costSoFar = { [start]: 0 };

    while (frontier.size > 0) {
        const currentKey = frontier.pop();
        const [cq, cr] = currentKey.split(',').map(Number);

        for (const n of hexNeighbors(cq, cr)) {
            const nKey = hexKey(n.q, n.r);
            const moveCost = getMovementCost(cq, cr, n.q, n.r, unit);
            if (moveCost === Infinity) continue;

            const newCost = costSoFar[currentKey] + moveCost;
            if (newCost > unit.movementLeft) continue;

            if (!(nKey in costSoFar) || newCost < costSoFar[nKey]) {
                costSoFar[nKey] = newCost;
                frontier.push(nKey, newCost);
            }
        }
    }

    return costSoFar;
}

export function moveUnit(unit, path) {
    if (!path || path.length < 2) return false;
    const lastReachable = findLastReachable(unit, path);
    if (lastReachable < 1) return false;

    const target = path[lastReachable];
    const cost = target.cost;
    unit.q = target.q;
    unit.r = target.r;
    unit.movementLeft = Math.max(0, unit.movementLeft - cost);
    return true;
}

function findLastReachable(unit, path) {
    for (let i = path.length - 1; i >= 1; i--) {
        if (path[i].cost <= unit.movementLeft) return i;
    }
    return 0;
}

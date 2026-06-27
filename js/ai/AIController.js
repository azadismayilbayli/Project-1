import { getState } from '../core/GameState.js';
import { AI_PERSONALITIES, UNIT_TYPES, BUILDINGS, TECHS } from '../config.js';
import { getPlayerCities, getCityIncome, startProduction } from '../city/City.js';
import { getPlayerUnits, createUnit } from '../unit/Unit.js';
import { findPath, moveUnit, getReachableTiles } from '../unit/Movement.js';
import { canAttack, resolveCombat, attackCity } from '../combat/CombatEngine.js';
import { isAtWar, declareWar, offerPeace, getRelation } from '../diplomacy/DiplomacyManager.js';
import { canResearch, getAvailableTechs, startResearch } from '../tech/TechTree.js';
import { canAfford, spendResources } from '../economy/EconomyManager.js';
import { hexDistance, hexNeighbors } from '../utils.js';
import { getTile } from '../map/HexGrid.js';
import { EventBus } from '../events.js';

export function processAITurn(playerId) {
    const state = getState();
    const player = state.players[playerId];
    if (player.defeated) return;

    const personality = AI_PERSONALITIES[player.aiPersonality] || AI_PERSONALITIES.balanced;

    aiResearch(playerId);
    aiBuild(playerId, personality);
    aiRecruit(playerId, personality);
    aiMoveAndAttack(playerId, personality);
    aiDiplomacy(playerId, personality);
}

function aiResearch(playerId) {
    const player = getState().players[playerId];
    if (player.researchQueue) return;

    const available = getAvailableTechs(playerId);
    if (available.length === 0) return;

    const prioritized = available.sort((a, b) => {
        let scoreA = 0, scoreB = 0;
        if (a.category === 'military') scoreA += 3;
        if (a.category === 'economy') scoreA += 2;
        if (b.category === 'military') scoreB += 3;
        if (b.category === 'economy') scoreB += 2;
        if (a.unlocks && a.unlocks.length > 0) scoreA += 2;
        if (b.unlocks && b.unlocks.length > 0) scoreB += 2;
        scoreA -= a.cost * 0.01;
        scoreB -= b.cost * 0.01;
        return scoreB - scoreA;
    });

    startResearch(playerId, prioritized[0].key);
}

function aiBuild(playerId, personality) {
    const cities = getPlayerCities(playerId);
    const player = getState().players[playerId];

    for (const city of cities) {
        if (city.currentProduction) continue;

        const available = Object.entries(BUILDINGS).filter(([key, b]) => {
            if (city.buildings.includes(key)) return false;
            if (b.prereqTech && !player.techs.includes(b.prereqTech)) return false;
            return canAfford(playerId, b.cost);
        });

        if (available.length === 0) continue;

        let best = null;
        let bestScore = -1;

        for (const [key, b] of available) {
            let score = 0;
            if (b.category === 'economic') score += personality.weights.economy * 10;
            if (b.category === 'military') score += personality.weights.military * 10;
            if (b.category === 'defensive') score += (1 - personality.weights.expansion) * 8;
            if (b.effects.food) score += b.effects.food;
            if (b.effects.gold) score += b.effects.gold;
            if (b.effects.production) score += b.effects.production * 1.5;
            if (b.effects.science) score += b.effects.science;

            if (score > bestScore) {
                bestScore = score;
                best = key;
            }
        }

        if (best) {
            spendResources(playerId, BUILDINGS[best].cost);
            startProduction(city, best);
        }
    }
}

function aiRecruit(playerId, personality) {
    const state = getState();
    const player = state.players[playerId];
    const cities = getPlayerCities(playerId);
    const units = getPlayerUnits(playerId);

    const maxUnits = cities.length * 3 + 2;
    if (units.length >= maxUnits) return;

    const affordableTypes = Object.entries(UNIT_TYPES).filter(([key, t]) => {
        if (t.prereqTech && !player.techs.includes(t.prereqTech)) return false;
        if (t.category === 'naval' || t.category === 'air') return false;
        return canAfford(playerId, t.cost);
    });

    if (affordableTypes.length === 0) return;

    for (const city of cities) {
        if (units.length >= maxUnits) break;
        const nearbyUnits = units.filter(u => hexDistance({ q: u.q, r: u.r }, { q: city.q, r: city.r }) <= 3);
        if (nearbyUnits.length >= 3) continue;

        const sorted = affordableTypes.sort((a, b) => {
            const scoreA = (a[1].atk + a[1].def) * personality.weights.military;
            const scoreB = (b[1].atk + b[1].def) * personality.weights.military;
            return scoreB - scoreA;
        });

        const [typeKey, typeDef] = sorted[0];
        if (canAfford(playerId, typeDef.cost)) {
            spendResources(playerId, typeDef.cost);
            createUnit(typeKey, playerId, city.q, city.r);
        }
    }
}

function aiMoveAndAttack(playerId, personality) {
    const state = getState();
    const units = getPlayerUnits(playerId);
    const enemyUnits = state.units.filter(u => u.owner !== playerId && u.hp > 0 && isAtWar(playerId, u.owner));
    const enemyCities = state.cities.filter(c => c.owner !== playerId && isAtWar(playerId, c.owner));
    const myCities = getPlayerCities(playerId);

    for (const unit of units) {
        if (unit.movementLeft <= 0) continue;

        let target = null;
        let targetType = null;
        let bestDist = Infinity;

        for (const enemy of enemyUnits) {
            const dist = hexDistance({ q: unit.q, r: unit.r }, { q: enemy.q, r: enemy.r });
            if (dist < bestDist) {
                bestDist = dist;
                target = enemy;
                targetType = 'unit';
            }
        }

        for (const city of enemyCities) {
            const dist = hexDistance({ q: unit.q, r: unit.r }, { q: city.q, r: city.r });
            if (dist < bestDist * 1.5) {
                bestDist = dist;
                target = city;
                targetType = 'city';
            }
        }

        if (!target && personality.weights.expansion < 0.3) {
            const capital = myCities.find(c => c.isCapital) || myCities[0];
            if (capital && hexDistance({ q: unit.q, r: unit.r }, { q: capital.q, r: capital.r }) > 5) {
                target = capital;
                targetType = 'defend';
            }
        }

        if (target) {
            if (targetType === 'unit' && canAttack(unit, target)) {
                resolveCombat(unit, target);
            } else if (targetType === 'city' && hexDistance({ q: unit.q, r: unit.r }, { q: target.q, r: target.r }) <= unit.range) {
                attackCity(unit, target);
            } else {
                const path = findPath(unit, target.q, target.r);
                if (path && path.length > 1) {
                    moveUnit(unit, path);
                }
            }
        }
    }
}

function aiDiplomacy(playerId, personality) {
    const state = getState();

    for (let i = 0; i < state.players.length; i++) {
        if (i === playerId || state.players[i].defeated) continue;

        const relation = getRelation(playerId, i);

        if (!isAtWar(playerId, i)) {
            const myStrength = getPlayerUnits(playerId).reduce((s, u) => s + u.attack + u.defense, 0);
            const theirStrength = getPlayerUnits(i).reduce((s, u) => s + u.attack + u.defense, 0);

            if (relation < -30 && myStrength > theirStrength * 1.3 && Math.random() < (1 - personality.warThreshold)) {
                declareWar(playerId, i);
                EventBus.emit('notification', { message: `${state.players[playerId].name} declares war on ${state.players[i].name}!`, type: 'war' });
            }
        } else {
            const myUnits = getPlayerUnits(playerId).length;
            const theirUnits = getPlayerUnits(i).length;
            if (myUnits < theirUnits * 0.5 && Math.random() < personality.peaceThreshold) {
                offerPeace(playerId, i);
                EventBus.emit('notification', { message: `${state.players[playerId].name} offers peace to ${state.players[i].name}.`, type: 'diplomacy' });
            }
        }
    }
}

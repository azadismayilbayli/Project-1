import { UNIT_TYPES } from '../config.js';
import { getState, nextId } from '../core/GameState.js';

export function createUnit(typeKey, owner, q, r) {
    const type = UNIT_TYPES[typeKey];
    if (!type) return null;
    const state = getState();
    const unit = {
        id: nextId(),
        typeKey,
        type,
        owner,
        q, r,
        hp: type.hp,
        maxHp: type.hp,
        attack: type.atk,
        defense: type.def,
        movement: type.mov,
        movementLeft: type.mov,
        range: type.range,
        experience: 0,
        morale: 100,
        supply: 100,
        fuel: 100,
        ammunition: 100,
        generalId: null,
        fortified: false,
        embarked: false
    };
    state.units.push(unit);
    return unit;
}

export function removeUnit(unitId) {
    const state = getState();
    state.units = state.units.filter(u => u.id !== unitId);
    if (state.selectedUnit === unitId) state.selectedUnit = null;
}

export function getUnit(unitId) {
    return getState().units.find(u => u.id === unitId);
}

export function getPlayerUnits(playerId) {
    return getState().units.filter(u => u.owner === playerId && u.hp > 0);
}

export function healUnit(unit, amount) {
    unit.hp = Math.min(unit.maxHp, unit.hp + amount);
}

export function refreshUnits(playerId) {
    const units = getPlayerUnits(playerId);
    for (const u of units) {
        u.movementLeft = u.movement;
        u.fortified = false;
        if (u.supply > 50) {
            healUnit(u, Math.floor(u.maxHp * 0.05));
        }
    }
}

import { COMBAT, WEATHER_TYPES } from '../config.js';
import { hexNeighbors, hexDistance } from '../utils.js';
import { getTile } from '../map/HexGrid.js';
import { getState } from '../core/GameState.js';
import { removeUnit } from '../unit/Unit.js';
import { captureCity } from '../city/City.js';
import { EventBus } from '../events.js';

export function calculateCombat(attacker, defender) {
    const state = getState();
    const defTile = getTile(defender.q, defender.r);
    const atkTile = getTile(attacker.q, attacker.r);

    let atkPower = attacker.attack * (attacker.hp / attacker.maxHp);
    let defPower = defender.defense * (defender.hp / defender.maxHp);

    const terrainDef = defTile ? defTile.terrain.defBonus : 0;
    defPower *= (1 + terrainDef);

    if (defender.fortified) defPower *= 1.25;

    const defCity = state.cities.find(c => c.q === defender.q && c.r === defender.r);
    if (defCity) {
        const wallBonus = defCity.buildings.includes('cityWalls') ? 0.5 : 0;
        const fortBonus = defCity.buildings.includes('fort') ? 0.3 : 0;
        const bunkerBonus = defCity.buildings.includes('bunker') ? 0.5 : 0;
        defPower *= (1 + wallBonus + fortBonus + bunkerBonus);
    }

    const atkNeighbors = hexNeighbors(defender.q, defender.r);
    let flankers = 0;
    for (const n of atkNeighbors) {
        const friendlyAtN = state.units.find(u => u.q === n.q && u.r === n.r && u.owner === attacker.owner && u.id !== attacker.id && u.hp > 0);
        if (friendlyAtN) flankers++;
    }
    if (flankers >= 1) atkPower *= (1 + COMBAT.flankingBonus * flankers);
    if (flankers >= COMBAT.encirclementThreshold) atkPower *= (1 + COMBAT.encirclementBonus);

    if (atkTile && defTile && atkTile.terrain.name === 'River') {
        atkPower *= (1 - COMBAT.riverCrossingPenalty);
    }

    const weather = state.weather.current;
    atkPower *= weather.combatMod;
    defPower *= weather.combatMod;

    atkPower *= (attacker.morale / 100);
    defPower *= (defender.morale / 100);

    atkPower *= (attacker.supply / 100);
    defPower *= (defender.supply / 100);

    const atkGeneral = attacker.generalId ? state.generals.find(g => g.id === attacker.generalId) : null;
    const defGeneral = defender.generalId ? state.generals.find(g => g.id === defender.generalId) : null;

    if (atkGeneral) {
        atkPower *= (1 + atkGeneral.leadership * 0.02);
        atkPower *= (1 + atkGeneral.aggression * 0.01);
    }
    if (defGeneral) {
        defPower *= (1 + defGeneral.leadership * 0.02);
    }

    const atkExp = 1 + attacker.experience * 0.005;
    const defExp = 1 + defender.experience * 0.005;
    atkPower *= atkExp;
    defPower *= defExp;

    const isCrit = Math.random() < COMBAT.critChance;
    if (isCrit) atkPower *= COMBAT.critMultiplier;

    const baseDmgToDefender = Math.max(1, Math.floor(atkPower - defPower * 0.5));
    const baseDmgToAttacker = Math.max(1, Math.floor(defPower * 0.5 - atkPower * 0.2));
    const counterDmg = attacker.range > 1 ? 0 : Math.max(0, baseDmgToAttacker);

    return {
        damageToDefender: baseDmgToDefender,
        damageToAttacker: counterDmg,
        isCrit,
        flankers,
        terrainDef,
        weatherMod: weather.combatMod,
        attackerMorale: attacker.morale,
        defenderMorale: defender.morale
    };
}

export function resolveCombat(attacker, defender) {
    const result = calculateCombat(attacker, defender);
    const state = getState();

    defender.hp -= result.damageToDefender;
    attacker.hp -= result.damageToAttacker;

    attacker.experience += COMBAT.experiencePerBattle;
    defender.experience += COMBAT.experiencePerBattle;

    const moraleLoss = result.damageToDefender / defender.maxHp * 30;
    defender.morale = Math.max(0, defender.morale - moraleLoss);
    attacker.morale = Math.max(0, attacker.morale - (result.damageToAttacker / attacker.maxHp * 20));

    if (attacker.generalId) {
        const gen = state.generals.find(g => g.id === attacker.generalId);
        if (gen) gen.experience += 5;
    }
    if (defender.generalId) {
        const gen = state.generals.find(g => g.id === defender.generalId);
        if (gen) gen.experience += 5;
    }

    let defenderKilled = false;
    let attackerKilled = false;
    let cityCaptured = null;

    if (defender.hp <= 0) {
        defenderKilled = true;
        removeUnit(defender.id);

        const city = state.cities.find(c => c.q === defender.q && c.r === defender.r && c.owner === defender.owner);
        if (city) {
            city.hp -= Math.floor(result.damageToDefender * 0.3);
            if (city.hp <= 0 && !state.units.some(u => u.q === city.q && u.r === city.r && u.owner === city.owner && u.hp > 0)) {
                captureCity(city, attacker.owner);
                cityCaptured = city;
            }
        }

        if (attacker.hp > 0 && attacker.range <= 1) {
            attacker.q = defender.q;
            attacker.r = defender.r;
        }
    }

    if (attacker.hp <= 0) {
        attackerKilled = true;
        removeUnit(attacker.id);
    }

    attacker.movementLeft = 0;

    const combatResult = {
        ...result,
        defenderKilled,
        attackerKilled,
        cityCaptured,
        attacker: { ...attacker },
        defender: { ...defender }
    };

    EventBus.emit('combat:resolved', combatResult);
    return combatResult;
}

export function canAttack(attacker, defender) {
    if (attacker.owner === defender.owner) return false;
    if (attacker.movementLeft <= 0) return false;
    if (attacker.hp <= 0 || defender.hp <= 0) return false;
    const dist = hexDistance({ q: attacker.q, r: attacker.r }, { q: defender.q, r: defender.r });
    return dist <= attacker.range;
}

export function attackCity(attacker, city) {
    const state = getState();
    if (attacker.owner === city.owner) return null;

    const atkPower = attacker.attack * (attacker.hp / attacker.maxHp);
    let damage = Math.max(5, Math.floor(atkPower * 0.8));

    const wallBonus = city.buildings.includes('cityWalls') ? 0.5 : 0;
    damage = Math.floor(damage * (1 - wallBonus * 0.5));

    city.hp -= damage;
    attacker.movementLeft = 0;
    attacker.experience += 5;

    let captured = false;
    if (city.hp <= 0) {
        const defenders = state.units.filter(u => u.q === city.q && u.r === city.r && u.owner === city.owner && u.hp > 0);
        if (defenders.length === 0) {
            captureCity(city, attacker.owner);
            captured = true;
            if (attacker.range <= 1) {
                attacker.q = city.q;
                attacker.r = city.r;
            }
        }
    }

    return { damage, captured, cityHp: city.hp };
}

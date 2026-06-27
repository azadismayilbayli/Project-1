import { getState } from '../core/GameState.js';
import { getPlayerCities, getCityIncome } from '../city/City.js';
import { applyDoctrineToIncome } from '../features/Doctrines.js';
import { getWonderBonus } from '../features/Wonders.js';

export function calculateIncome(playerId) {
    const cities = getPlayerCities(playerId);
    const income = { gold: 0, food: 0, production: 0, science: 0, oil: 0, coal: 0, iron: 0, timber: 0, stone: 0, rubber: 0, rareEarth: 0 };

    for (const city of cities) {
        const ci = getCityIncome(city);
        for (const key of Object.keys(income)) {
            income[key] += ci[key] || 0;
        }
    }

    const state = getState();
    const player = state.players[playerId];

    // Wonder bonuses (multiplicative on base totals)
    income.science = Math.floor(income.science * (1 + getWonderBonus(playerId, 'scienceMod')));
    income.gold = Math.floor(income.gold * (1 + getWonderBonus(playerId, 'goldMod')));
    income.food = Math.floor(income.food * (1 + getWonderBonus(playerId, 'foodMod')));

    // Doctrine bonuses
    applyDoctrineToIncome(player, income);

    return income;
}

export function processEconomy(playerId) {
    const state = getState();
    const player = state.players[playerId];
    const income = calculateIncome(playerId);

    const units = state.units.filter(u => u.owner === playerId && u.hp > 0);
    const maintenance = units.length * 5;

    player.income = { ...income };
    player.resources.gold += income.gold - maintenance;
    player.resources.food += income.food;
    player.resources.production += income.production;
    player.resources.science += income.science;
    player.resources.oil += income.oil;
    player.resources.coal += income.coal;
    player.resources.iron += income.iron;
    player.resources.timber += income.timber;
    player.resources.stone += income.stone;
    player.resources.rubber += income.rubber;
    player.resources.rareEarth += income.rareEarth;

    if (player.resources.gold < 0) {
        player.politics.happiness -= 5;
        player.resources.gold = 0;
    }

    return income;
}

export function canAfford(playerId, costs) {
    const player = getState().players[playerId];
    for (const [resource, amount] of Object.entries(costs)) {
        if ((player.resources[resource] || 0) < amount) return false;
    }
    return true;
}

export function spendResources(playerId, costs) {
    const player = getState().players[playerId];
    for (const [resource, amount] of Object.entries(costs)) {
        player.resources[resource] = (player.resources[resource] || 0) - amount;
    }
}

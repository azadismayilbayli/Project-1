// World Wonders - unique megaprojects. Only ONE of each can exist in the world.
// First nation to complete it gets a powerful, permanent, nation-wide bonus.
// This creates a competitive "race" layer over the normal build economy.

import { getState } from '../core/GameState.js';
import { getPlayerCities } from '../city/City.js';
import { EventBus } from '../events.js';

export const WONDERS = {
    grandCitadel: {
        name: 'The Grand Citadel', icon: '\u{1F3F0}',
        cost: { gold: 600, production: 400, stone: 30 },
        description: 'All your cities gain +40% defense and +100 max HP.',
        effects: { cityDefense: 0.4, cityHp: 100 }
    },
    eternalLibrary: {
        name: 'The Eternal Library', icon: '\u{1F4DA}',
        cost: { gold: 500, production: 350, timber: 30 },
        description: '+30% science empire-wide and reveals the entire map.',
        effects: { scienceMod: 0.3, revealMap: true }
    },
    goldenExchange: {
        name: 'The Golden Exchange', icon: '\u{1F3E6}',
        cost: { gold: 400, production: 400, rareEarth: 10 },
        description: '+35% gold empire-wide. Trade deals worth double.',
        effects: { goldMod: 0.35, tradeDouble: true }
    },
    warMonument: {
        name: 'Monument to the Fallen', icon: '\u{1F5FF}',
        cost: { gold: 550, production: 450, iron: 30 },
        description: 'All units gain +20% attack and start with +25 morale.',
        effects: { unitAttack: 0.2, startMorale: 25 }
    },
    skyFortress: {
        name: 'The Sky Fortress', icon: '\u{1F6F8}',
        cost: { gold: 800, production: 600, oil: 40, rareEarth: 20 },
        description: 'Reveals all enemy movements and gives +50% air combat power.',
        effects: { revealEnemies: true, airBonus: 0.5 }
    },
    greatGranary: {
        name: 'The Great Granary', icon: '\u{1F33E}',
        cost: { gold: 350, production: 300, food: 100 },
        description: '+50% food empire-wide. Cities grow 30% faster.',
        effects: { foodMod: 0.5, growthMod: 0.3 }
    }
};

export function getAvailableWonders() {
    const state = getState();
    const built = new Set(state.wonders ? state.wonders.map(w => w.key) : []);
    const inProgress = new Set();
    for (const city of state.cities) {
        if (city.wonderInProgress) inProgress.add(city.wonderInProgress);
    }
    return Object.entries(WONDERS)
        .filter(([key]) => !built.has(key))
        .map(([key, w]) => ({ key, ...w, claimed: inProgress.has(key) }));
}

export function isWonderBuilt(key) {
    const state = getState();
    return state.wonders && state.wonders.some(w => w.key === key);
}

export function startWonder(city, wonderKey) {
    if (isWonderBuilt(wonderKey)) return false;
    city.wonderInProgress = wonderKey;
    city.wonderProgress = 0;
    return true;
}

export function processWonderProgress(city, productionAmount) {
    if (!city.wonderInProgress) return;
    const state = getState();

    if (isWonderBuilt(city.wonderInProgress)) {
        // Someone else finished it first
        EventBus.emit('notification', { message: `${WONDERS[city.wonderInProgress].name} was completed by a rival nation!`, type: 'war' });
        city.wonderInProgress = null;
        city.wonderProgress = 0;
        return;
    }

    city.wonderProgress = (city.wonderProgress || 0) + productionAmount;
    const wonder = WONDERS[city.wonderInProgress];
    const totalCost = wonder.cost.production;

    if (city.wonderProgress >= totalCost) {
        if (!state.wonders) state.wonders = [];
        state.wonders.push({ key: city.wonderInProgress, owner: city.owner, cityId: city.id, turn: state.turn });

        const wonderKey = city.wonderInProgress;
        city.wonderInProgress = null;
        city.wonderProgress = 0;

        applyWonderEffects(city.owner, wonderKey);
        EventBus.emit('wonder:completed', { wonderKey, owner: city.owner, cityName: city.name });
    }
}

function applyWonderEffects(ownerId, wonderKey) {
    const wonder = WONDERS[wonderKey];
    const state = getState();
    const e = wonder.effects;

    if (e.cityHp) {
        for (const city of getPlayerCities(ownerId)) {
            city.maxHp += e.cityHp;
            city.hp += e.cityHp;
        }
    }
    if (e.revealMap && ownerId === 0) {
        const player = state.players[0];
        for (const key of Object.keys(state.tiles)) {
            player.exploredTiles.add(key);
        }
    }
}

export function getWonderBonus(ownerId, effectName) {
    const state = getState();
    if (!state.wonders) return 0;
    let total = 0;
    for (const w of state.wonders) {
        if (w.owner === ownerId) {
            const eff = WONDERS[w.key].effects[effectName];
            if (typeof eff === 'number') total += eff;
        }
    }
    return total;
}

export function hasWonderFlag(ownerId, flagName) {
    const state = getState();
    if (!state.wonders) return false;
    return state.wonders.some(w => w.owner === ownerId && WONDERS[w.key].effects[flagName] === true);
}

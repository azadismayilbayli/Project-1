import { getState } from '../core/GameState.js';
import { getPlayerCities } from '../city/City.js';
import { isAtWar } from '../diplomacy/DiplomacyManager.js';
import { EventBus } from '../events.js';

export function processPolitics(playerId) {
    const state = getState();
    const player = state.players[playerId];
    const pol = player.politics;
    const cities = getPlayerCities(playerId);

    let atWarWith = 0;
    for (let i = 0; i < state.players.length; i++) {
        if (i !== playerId && isAtWar(playerId, i)) atWarWith++;
    }

    if (atWarWith > 0) {
        pol.warSupport = Math.max(0, pol.warSupport - 1);
        pol.nationalUnity += 2;
    } else {
        pol.warSupport = Math.min(100, pol.warSupport + 1);
    }

    const avgHappiness = cities.length > 0
        ? cities.reduce((sum, c) => sum + Math.min(100, c.population * 5 + (c.buildings.includes('market') ? 10 : 0)), 0) / cities.length
        : 50;
    pol.happiness = Math.floor(pol.happiness * 0.9 + avgHappiness * 0.1);

    if (player.resources.gold > cities.length * 50) {
        pol.corruption = Math.min(100, pol.corruption + 0.5);
    } else {
        pol.corruption = Math.max(0, pol.corruption - 0.5);
    }

    const techReduction = player.techs.includes('democracy') ? 5 : 0;
    pol.corruption = Math.max(0, pol.corruption - techReduction * 0.1);

    pol.stability = Math.floor(
        pol.happiness * 0.3 +
        pol.nationalUnity * 0.3 +
        (100 - pol.corruption) * 0.2 +
        pol.warSupport * 0.2
    );

    pol.nationalUnity = Math.max(0, Math.min(100, pol.nationalUnity));
    pol.stability = Math.max(0, Math.min(100, pol.stability));
    pol.happiness = Math.max(0, Math.min(100, pol.happiness));

    if (pol.stability < 20) {
        EventBus.emit('politics:unrest', { playerId, stability: pol.stability });
    }

    return pol;
}

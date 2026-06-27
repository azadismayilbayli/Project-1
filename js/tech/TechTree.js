import { TECHS } from '../config.js';
import { getState } from '../core/GameState.js';
import { EventBus } from '../events.js';

export function canResearch(playerId, techKey) {
    const player = getState().players[playerId];
    if (player.techs.includes(techKey)) return false;
    const tech = TECHS[techKey];
    if (!tech) return false;
    return tech.prereqs.every(p => player.techs.includes(p));
}

export function getAvailableTechs(playerId) {
    return Object.entries(TECHS)
        .filter(([key]) => canResearch(playerId, key))
        .map(([key, tech]) => ({ key, ...tech }));
}

export function startResearch(playerId, techKey) {
    const player = getState().players[playerId];
    if (!canResearch(playerId, techKey)) return false;
    player.researchQueue = techKey;
    player.researchProgress = 0;
    return true;
}

export function processResearch(playerId) {
    const player = getState().players[playerId];
    if (!player.researchQueue) return null;

    const tech = TECHS[player.researchQueue];
    if (!tech) return null;

    player.researchProgress += player.resources.science || 1;

    if (player.researchProgress >= tech.cost) {
        const completedTech = player.researchQueue;
        player.techs.push(completedTech);
        player.researchQueue = null;
        player.researchProgress = 0;
        EventBus.emit('tech:completed', { playerId, techKey: completedTech });
        return completedTech;
    }
    return null;
}

export function hasTech(playerId, techKey) {
    return getState().players[playerId].techs.includes(techKey);
}

export function getTechProgress(playerId) {
    const player = getState().players[playerId];
    if (!player.researchQueue) return null;
    const tech = TECHS[player.researchQueue];
    return {
        techKey: player.researchQueue,
        tech,
        progress: player.researchProgress,
        total: tech.cost,
        percent: Math.floor((player.researchProgress / tech.cost) * 100)
    };
}

export function getResearchedTechs(playerId) {
    return getState().players[playerId].techs;
}

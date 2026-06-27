import { getState } from '../core/GameState.js';
import { EventBus } from '../events.js';

export function getRelation(p1, p2) {
    return getState().diplomacy.relations[p1][p2];
}

export function changeRelation(p1, p2, amount) {
    const state = getState();
    state.diplomacy.relations[p1][p2] = Math.max(-100, Math.min(100, state.diplomacy.relations[p1][p2] + amount));
    state.diplomacy.relations[p2][p1] = Math.max(-100, Math.min(100, state.diplomacy.relations[p2][p1] + amount));
}

export function isAtWar(p1, p2) {
    return getState().diplomacy.treaties.some(t => t.type === 'war' && ((t.from === p1 && t.to === p2) || (t.from === p2 && t.to === p1)));
}

export function isAllied(p1, p2) {
    return getState().diplomacy.treaties.some(t => t.type === 'alliance' && ((t.from === p1 && t.to === p2) || (t.from === p2 && t.to === p1)));
}

export function hasNonAggression(p1, p2) {
    return getState().diplomacy.treaties.some(t => t.type === 'nonAggression' && ((t.from === p1 && t.to === p2) || (t.from === p2 && t.to === p1)));
}

export function hasTrade(p1, p2) {
    return getState().diplomacy.treaties.some(t => t.type === 'trade' && ((t.from === p1 && t.to === p2) || (t.from === p2 && t.to === p1)));
}

export function declareWar(from, to) {
    const state = getState();
    if (isAtWar(from, to)) return false;

    state.diplomacy.treaties = state.diplomacy.treaties.filter(t =>
        !((t.from === from && t.to === to) || (t.from === to && t.to === from))
    );

    state.diplomacy.treaties.push({ type: 'war', from, to, turn: state.turn });
    changeRelation(from, to, -100);
    state.players[from].politics.warSupport -= 10;

    EventBus.emit('diplomacy:war', { from, to });
    return true;
}

export function offerPeace(from, to) {
    const state = getState();
    if (!isAtWar(from, to)) return false;

    state.diplomacy.treaties = state.diplomacy.treaties.filter(t =>
        !(t.type === 'war' && ((t.from === from && t.to === to) || (t.from === to && t.to === from)))
    );

    changeRelation(from, to, 20);
    EventBus.emit('diplomacy:peace', { from, to });
    return true;
}

export function formAlliance(from, to) {
    const state = getState();
    if (isAtWar(from, to) || isAllied(from, to)) return false;
    state.diplomacy.treaties.push({ type: 'alliance', from, to, turn: state.turn });
    changeRelation(from, to, 40);
    EventBus.emit('diplomacy:alliance', { from, to });
    return true;
}

export function signNonAggression(from, to) {
    const state = getState();
    if (isAtWar(from, to)) return false;
    state.diplomacy.treaties.push({ type: 'nonAggression', from, to, turn: state.turn });
    changeRelation(from, to, 25);
    return true;
}

export function signTradeAgreement(from, to) {
    const state = getState();
    if (isAtWar(from, to)) return false;
    state.diplomacy.treaties.push({ type: 'trade', from, to, turn: state.turn });
    changeRelation(from, to, 15);
    return true;
}

export function getDiplomacyStatus(playerId) {
    const state = getState();
    const statuses = [];
    for (let i = 0; i < state.players.length; i++) {
        if (i === playerId || state.players[i].defeated) continue;
        statuses.push({
            playerId: i,
            name: state.players[i].name,
            color: state.players[i].color,
            relation: getRelation(playerId, i),
            atWar: isAtWar(playerId, i),
            allied: isAllied(playerId, i),
            nonAggression: hasNonAggression(playerId, i),
            trade: hasTrade(playerId, i)
        });
    }
    return statuses;
}

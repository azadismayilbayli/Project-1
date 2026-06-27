// Save/Load via localStorage. Serializes the full game state, excluding
// derived/cached data (Sets are converted to arrays for JSON safety).

import { getState, setState } from './GameState.js';
import { EventBus } from '../events.js';

const SAVE_KEY = 'grandStrategy_save';

export function saveGame() {
    const state = getState();
    if (!state) return false;

    const serializable = {
        ...state,
        players: state.players.map(p => ({
            ...p,
            visibleTiles: Array.from(p.visibleTiles),
            exploredTiles: Array.from(p.exploredTiles)
        }))
    };

    // Strip transient references that shouldn't persist
    serializable.selectedUnit = null;
    serializable.selectedCity = null;
    serializable.movePath = null;
    serializable.hoveredHex = null;

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(serializable));
        EventBus.emit('notification', { message: '\u{1F4BE} Game saved.', type: 'info' });
        return true;
    } catch (e) {
        EventBus.emit('notification', { message: 'Save failed: ' + e.message, type: 'war' });
        return false;
    }
}

export function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;

        const data = JSON.parse(raw);

        // Rehydrate terrain references on tiles (they were serialized as plain objects)
        for (const key of Object.keys(data.tiles)) {
            const tile = data.tiles[key];
            // terrain object survives JSON since it's plain data
        }

        data.players = data.players.map(p => ({
            ...p,
            visibleTiles: new Set(p.visibleTiles || []),
            exploredTiles: new Set(p.exploredTiles || [])
        }));

        setState(data);
        EventBus.emit('notification', { message: '\u{1F4C2} Game loaded.', type: 'info' });
        EventBus.emit('game:loaded');
        return true;
    } catch (e) {
        EventBus.emit('notification', { message: 'Load failed: ' + e.message, type: 'war' });
        return false;
    }
}

export function hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
}

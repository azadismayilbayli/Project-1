import { WEATHER_TYPES } from '../config.js';
import { getState } from '../core/GameState.js';

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_WEATHER_WEIGHTS = {
    spring: { clear: 40, rain: 35, fog: 15, storm: 10 },
    summer: { clear: 50, rain: 15, sandstorm: 15, storm: 10, fog: 10 },
    autumn: { clear: 25, rain: 40, fog: 20, storm: 15 },
    winter: { clear: 20, snow: 40, fog: 15, storm: 15, rain: 10 }
};

export function processWeather() {
    const state = getState();
    const w = state.weather;

    if (state.turn % 8 === 0) {
        const idx = SEASONS.indexOf(w.season);
        w.season = SEASONS[(idx + 1) % 4];
    }

    w.turnsSinceChange++;
    if (w.turnsSinceChange >= 2 + Math.floor(Math.random() * 3)) {
        w.current = rollWeather(w.season);
        w.turnsSinceChange = 0;
    }
}

function rollWeather(season) {
    const weights = SEASON_WEATHER_WEIGHTS[season];
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (const [key, weight] of Object.entries(weights)) {
        roll -= weight;
        if (roll <= 0) return WEATHER_TYPES[key];
    }
    return WEATHER_TYPES.clear;
}

export function getWeatherEffects() {
    return getState().weather.current;
}

export function getSeasonName() {
    const s = getState().weather.season;
    return s.charAt(0).toUpperCase() + s.slice(1);
}

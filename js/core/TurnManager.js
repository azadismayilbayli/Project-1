import { getState } from './GameState.js';
import { processEconomy } from '../economy/EconomyManager.js';
import { processCityTurn, getPlayerCities } from '../city/City.js';
import { processResearch } from '../tech/TechTree.js';
import { processPolitics } from '../politics/PoliticsManager.js';
import { processWeather } from '../weather/WeatherSystem.js';
import { updateUnitSupply } from '../logistics/SupplySystem.js';
import { processAITurn } from '../ai/AIController.js';
import { refreshUnits, createUnit } from '../unit/Unit.js';
import { updateVisibility } from '../map/FogOfWar.js';
import { EventBus } from '../events.js';
import { checkPromotion, getPlayerGenerals } from '../general/General.js';
import { playSFX } from '../audio/AudioManager.js';
import { processRandomEvents, hasPendingChoice } from '../features/RandomEvents.js';
import { processWonderProgress } from '../features/Wonders.js';
import { getCityIncome } from '../city/City.js';

export function endTurn() {
    const state = getState();
    if (state.animating || state.gameOver) return;

    state.selectedUnit = null;
    state.selectedCity = null;
    state.movePath = null;

    for (let p = 0; p < state.players.length; p++) {
        if (state.players[p].defeated) continue;

        processEconomy(p);

        const cities = getPlayerCities(p);
        for (const city of cities) {
            const result = processCityTurn(city);
            if (result && result.type === 'unit') {
                createUnit(result.unitKey, p, city.q, city.r);
            }
            if (city.wonderInProgress) {
                const income = getCityIncome(city);
                processWonderProgress(city, income.production);
            }
        }

        processResearch(p);
        processPolitics(p);
        updateUnitSupply(p);
        refreshUnits(p);
        updateVisibility(p);

        const generals = getPlayerGenerals(p);
        for (const gen of generals) {
            checkPromotion(gen);
        }

        if (p > 0 && state.players[p].isAI) {
            processAITurn(p);
        }
    }

    processWeather();
    processRandomEvents();
    checkVictory();

    state.turn++;
    state.currentPlayer = 0;

    updateVisibility(0);

    playSFX('turn');
    EventBus.emit('turn:end', { turn: state.turn });
}

function checkVictory() {
    const state = getState();
    let aliveCount = 0;
    let lastAlive = -1;

    for (let i = 0; i < state.players.length; i++) {
        if (state.players[i].defeated) continue;
        const cities = getPlayerCities(i);
        const units = state.units.filter(u => u.owner === i && u.hp > 0);
        if (cities.length === 0 && units.length === 0) {
            state.players[i].defeated = true;
            EventBus.emit('notification', { message: `${state.players[i].name} has been defeated!`, type: 'defeat' });
        } else {
            aliveCount++;
            lastAlive = i;
        }
    }

    if (aliveCount <= 1 && lastAlive >= 0) {
        state.gameOver = true;
        state.winner = lastAlive;
        EventBus.emit('game:over', { winner: lastAlive });
    }
}

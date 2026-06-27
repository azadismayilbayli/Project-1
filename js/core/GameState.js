import { NATION_NAMES, PLAYER_COLORS, AI_PERSONALITIES, WEATHER_TYPES } from '../config.js';

let gameState = null;

export function createGameState(mapWidth, mapHeight, numPlayers = 4) {
    const personalityKeys = Object.keys(AI_PERSONALITIES);
    gameState = {
        turn: 1,
        phase: 'player',
        currentPlayer: 0,
        mapWidth,
        mapHeight,
        tiles: {},
        cities: [],
        units: [],
        generals: [],
        nextId: 1,
        players: [],
        diplomacy: { relations: [], treaties: [] },
        weather: { current: WEATHER_TYPES.clear, season: 'spring', turnsSinceChange: 0 },
        notifications: [],
        selectedUnit: null,
        selectedCity: null,
        hoveredHex: null,
        movePath: null,
        gameOver: false,
        winner: null,
        animating: false
    };

    for (let i = 0; i < numPlayers; i++) {
        gameState.players.push({
            id: i,
            name: NATION_NAMES[i] || `Nation ${i + 1}`,
            color: PLAYER_COLORS[i],
            isAI: i > 0,
            aiPersonality: i > 0 ? personalityKeys[(i - 1) % personalityKeys.length] : null,
            resources: { gold: 300, food: 100, production: 50, science: 0, oil: 5, coal: 5, iron: 10, timber: 10, stone: 5, rubber: 2, rareEarth: 1 },
            income: { gold: 0, food: 0, production: 0, science: 0 },
            techs: [],
            researchQueue: null,
            researchProgress: 0,
            politics: {
                stability: 70,
                warSupport: 50,
                happiness: 60,
                corruption: 10,
                inflation: 5,
                nationalUnity: 75
            },
            defeated: false,
            visibleTiles: new Set(),
            exploredTiles: new Set()
        });
    }

    for (let i = 0; i < numPlayers; i++) {
        gameState.diplomacy.relations[i] = [];
        for (let j = 0; j < numPlayers; j++) {
            gameState.diplomacy.relations[i][j] = i === j ? 100 : 0;
        }
    }

    return gameState;
}

export function getState() { return gameState; }
export function setState(s) { gameState = s; }
export function nextId() { return gameState.nextId++; }

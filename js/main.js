import { createGameState, getState } from './core/GameState.js';
import { MAP_SIZES } from './config.js';
import { Camera } from './map/Camera.js';
import { MapRenderer } from './map/MapRenderer.js';
import { generateMap } from './map/MapGenerator.js';
import { setupInput } from './core/InputHandler.js';
import { endTurn } from './core/TurnManager.js';
import { createCity } from './city/City.js';
import { createUnit } from './unit/Unit.js';
import { createGeneral, assignGeneral } from './general/General.js';
import { updateVisibility } from './map/FogOfWar.js';
import { initAudio, resumeAudio, playBGM } from './audio/AudioManager.js';
import { EventBus } from './events.js';
import { axialToPixel } from './utils.js';
import { setupUI } from './ui/UIManager.js';
import { initMinimap } from './ui/Minimap.js';
import { declareWar } from './diplomacy/DiplomacyManager.js';
import { playSFX } from './audio/AudioManager.js';
import { DOCTRINES } from './features/Doctrines.js';
import { initAnimations, updateAndRenderAnimations } from './animation/AnimationManager.js';

let canvas, ctx, camera, renderer;
let gameStarted = false;

export function startGame(mapSize = 'medium', numPlayers = 4, playerDoctrine = 'bloodAndIron') {
    const size = MAP_SIZES[mapSize];
    createGameState(size.width, size.height, numPlayers);

    const state = getState();
    state.players[0].doctrine = playerDoctrine;
    const startPositions = generateMap(size.width, size.height);

    for (let i = 0; i < numPlayers && i < startPositions.length; i++) {
        const pos = startPositions[i];
        const city = createCity(i, pos.q, pos.r);
        const unit1 = createUnit('infantry', i, pos.q + 1, pos.r);
        const unit2 = createUnit('infantry', i, pos.q, pos.r + 1);
        const unit3 = createUnit('militia', i, pos.q - 1, pos.r);

        const general = createGeneral(i);
        if (unit1) assignGeneral(general.id, unit1.id);

        for (let j = i + 1; j < numPlayers; j++) {
            if (Math.random() < 0.3) {
                declareWar(i, j);
            }
        }
    }

    for (let i = 0; i < numPlayers; i++) {
        updateVisibility(i);
    }

    if (startPositions.length > 0) {
        const p = axialToPixel(startPositions[0].q, startPositions[0].r);
        camera.centerOn(p.x, p.y);
        camera.x = p.x;
        camera.y = p.y;
    }

    gameStarted = true;
    initAudio();

    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('doctrine-select').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

    initAnimations();

    setupUI(canvas, camera);
    initMinimap(document.getElementById('minimap-canvas'), camera);

    canvas.addEventListener('click', () => {
        resumeAudio();
        playBGM();
    }, { once: true });
}

export function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    camera = new Camera(canvas);
    renderer = new MapRenderer(ctx, camera);
    setupInput(canvas, camera);

    function gameLoop() {
        if (gameStarted) {
            camera.update();
            ctx.fillStyle = '#0a0e1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            renderer.render();
            updateAndRenderAnimations(ctx, camera);
        }
        requestAnimationFrame(gameLoop);
    }
    gameLoop();

    document.getElementById('btn-start').addEventListener('click', () => {
        showDoctrineSelect();
    });
}

function showDoctrineSelect() {
    const size = document.getElementById('map-size').value;
    const players = parseInt(document.getElementById('num-players').value);

    document.getElementById('main-menu').style.display = 'none';
    const screen = document.getElementById('doctrine-select');
    screen.style.display = 'flex';

    const grid = document.getElementById('doctrine-grid');
    grid.innerHTML = Object.entries(DOCTRINES).map(([key, d]) => `
        <div class="doctrine-card" data-doctrine="${key}" style="--dc:${d.color}">
            <div class="dc-icon">${d.icon}</div>
            <div class="dc-name">${d.name}</div>
            <div class="dc-tagline">${d.tagline}</div>
            <div class="dc-desc">${d.description}</div>
            <button class="dc-select">Select</button>
        </div>
    `).join('');

    grid.querySelectorAll('.doctrine-card').forEach(card => {
        card.addEventListener('click', () => {
            startGame(size, players, card.dataset.doctrine);
        });
    });
}

window.endTurn = endTurn;
window.fortifyUnit = function() {
    const state = getState();
    if (!state.selectedUnit) return;
    const unit = state.units.find(u => u.id === state.selectedUnit);
    if (unit && unit.owner === state.currentPlayer) {
        unit.fortified = true;
        unit.movementLeft = 0;
        playSFX('click');
    }
};
window.addEventListener('DOMContentLoaded', init);

import { createGameState, getState } from './core/GameState.js';
import { MAP_SIZES } from './config.js';
import { Camera } from './map/Camera.js';
import { MapRenderer } from './map/MapRenderer.js';
import { buildWorldMap, applyOwnership, snapToLand, findLandNeighbors, NATIONS, NATIONS_BY_KEY, WORLD_WIDTH, WORLD_HEIGHT } from './map/WorldMap.js';
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

export function startGame(mapSize = 'medium', numPlayers = 4, playerDoctrine = 'bloodAndIron', playerNationKey = 'usa') {
    createGameState(WORLD_WIDTH, WORLD_HEIGHT, numPlayers);

    const state = getState();
    state.players[0].doctrine = playerDoctrine;

    buildWorldMap();

    // Active nations: the player's chosen nation first, then the rest for spread.
    const order = [playerNationKey, ...NATIONS.filter(n => n.key !== playerNationKey).map(n => n.key)];
    const activeKeys = order.slice(0, numPlayers);

    // Paint each active empire's real historical territory.
    const keyToPlayerId = {};
    activeKeys.forEach((k, i) => { keyToPlayerId[k] = i; });
    applyOwnership(activeKeys, keyToPlayerId);

    let firstCapital = null;
    for (let i = 0; i < activeKeys.length; i++) {
        const nation = NATIONS_BY_KEY[activeKeys[i]];
        const player = state.players[i];
        player.name = nation.name;
        player.color = nation.color;
        player.nationKey = nation.key;

        const cap = snapToLand(nation.capital.q, nation.capital.r);
        if (i === 0) firstCapital = cap;
        createCity(i, cap.q, cap.r, nation.capitalName);

        const spots = findLandNeighbors(cap.q, cap.r, 3);
        const unit1 = createUnit('infantry', i, spots[0].q, spots[0].r);
        createUnit('infantry', i, spots[1].q, spots[1].r);
        createUnit('militia', i, spots[2].q, spots[2].r);

        const general = createGeneral(i);
        if (unit1) assignGeneral(general.id, unit1.id);

        for (const c of nation.cities) {
            const pos = snapToLand(c.q, c.r);
            createCity(i, pos.q, pos.r, c.name);
        }
    }

    for (let i = 0; i < numPlayers; i++) {
        updateVisibility(i);
    }

    // The political world map is known to the player from the start.
    const human = state.players[0];
    for (const key of Object.keys(state.tiles)) human.exploredTiles.add(key);

    if (firstCapital) {
        const p = axialToPixel(firstCapital.q, firstCapital.r);
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
            ctx.fillStyle = '#15212a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            renderer.render();
            updateAndRenderAnimations(ctx, camera);
            drawParchmentOverlay(ctx);
            drawCompass(ctx);
        }
        requestAnimationFrame(gameLoop);
    }
    gameLoop();

    // Populate nation dropdown
    const nationSelect = document.getElementById('player-nation');
    if (nationSelect) {
        nationSelect.innerHTML = NATIONS.map(n => `<option value="${n.key}">${n.name}</option>`).join('');
    }

    document.getElementById('btn-start').addEventListener('click', () => {
        showDoctrineSelect();
    });
}

function drawParchmentOverlay(ctx) {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(40,28,12,0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}

function drawCompass(ctx) {
    const cx = ctx.canvas.width - 70, cy = ctx.canvas.height - 180, r = 34;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#5a4628';
    ctx.fillStyle = '#3a2c18';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r - 5, 0, Math.PI * 2); ctx.stroke();
    // 4-point star
    for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 - Math.PI / 2;
        const a2 = a + Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.lineTo(cx + Math.cos(a2) * 6, cy + Math.sin(a2) * 6);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fillStyle = i === 0 ? '#8a6a2f' : '#4a3820';
        ctx.fill();
        ctx.stroke();
    }
    ctx.fillStyle = '#c9a85f';
    ctx.font = 'bold 11px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', cx, cy - r - 7);
    ctx.restore();
}

function showDoctrineSelect() {
    const players = parseInt(document.getElementById('num-players').value);
    const nation = document.getElementById('player-nation').value;

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
            startGame('world', players, card.dataset.doctrine, nation);
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

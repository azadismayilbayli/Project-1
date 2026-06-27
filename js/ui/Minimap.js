import { getState } from '../core/GameState.js';
import { hexKey } from '../utils.js';
import { PLAYER_COLORS } from '../config.js';

let minimapCtx = null;
let minimapCanvas = null;

export function initMinimap(canvas, camera) {
    minimapCanvas = canvas;
    minimapCtx = canvas.getContext('2d');

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const state = getState();

        const mapPixelW = state.mapWidth * 5;
        const mapPixelH = state.mapHeight * 4;
        const scaleX = canvas.width / mapPixelW;
        const scaleY = canvas.height / mapPixelH;

        const worldX = (x / scaleX - mapPixelW / 2) * 10;
        const worldY = (y / scaleY - mapPixelH / 2) * 10;

        camera.centerOn(worldX, worldY);
    });

    setInterval(() => renderMinimap(camera), 500);
}

function renderMinimap(camera) {
    if (!minimapCtx) return;
    const state = getState();
    if (!state) return;

    const ctx = minimapCtx;
    const w = minimapCanvas.width;
    const h = minimapCanvas.height;

    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, w, h);

    const scaleX = w / state.mapWidth;
    const scaleY = h / state.mapHeight;

    for (let r = 0; r < state.mapHeight; r++) {
        for (let q = 0; q < state.mapWidth; q++) {
            const tile = state.tiles[hexKey(q, r)];
            if (!tile) continue;

            const player = state.players[0];
            const key = hexKey(q, r);
            if (player.visibleTiles.size > 0 && !player.exploredTiles.has(key)) continue;

            let color = tile.terrain.color;
            if (tile.owner !== null) {
                color = PLAYER_COLORS[tile.owner];
            }

            const px = q * scaleX + (r % 2) * scaleX * 0.3;
            const py = r * scaleY;

            ctx.fillStyle = color;
            ctx.globalAlpha = (player.visibleTiles.size > 0 && !player.visibleTiles.has(key)) ? 0.4 : 0.8;
            ctx.fillRect(px, py, Math.ceil(scaleX), Math.ceil(scaleY));
        }
    }

    ctx.globalAlpha = 1;

    for (const city of state.cities) {
        const px = city.q * scaleX + (city.r % 2) * scaleX * 0.3;
        const py = city.r * scaleY;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 1, py - 1, 3, 3);
    }

    for (const unit of state.units) {
        if (unit.hp <= 0) continue;
        const px = unit.q * scaleX + (unit.r % 2) * scaleX * 0.3;
        const py = unit.r * scaleY;
        ctx.fillStyle = PLAYER_COLORS[unit.owner];
        ctx.globalAlpha = 0.9;
        ctx.fillRect(px, py, 2, 2);
    }

    ctx.globalAlpha = 1;

    const viewport = camera.getViewport();
    const vx1 = ((viewport.left / 55.4 + state.mapWidth / 2) * scaleX);
    const vy1 = ((viewport.top / 48 + state.mapHeight / 2) * scaleY);
    const vx2 = ((viewport.right / 55.4 + state.mapWidth / 2) * scaleX);
    const vy2 = ((viewport.bottom / 48 + state.mapHeight / 2) * scaleY);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.strokeRect(vx1, vy1, vx2 - vx1, vy2 - vy1);
    ctx.globalAlpha = 1;
}

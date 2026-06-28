import { axialToPixel, drawHex, getHexCorners, hexKey, hexNeighbors } from '../utils.js';
import { HEX_SIZE, RESOURCES, PLAYER_COLORS } from '../config.js';
import { getState } from '../core/GameState.js';
import { getTile } from './HexGrid.js';
import { TOWNS, SEA_LABELS, REGION_LABELS } from './WorldMap.js';

const SQRT3 = Math.sqrt(3);

export class MapRenderer {
    constructor(ctx, camera) {
        this.ctx = ctx;
        this.camera = camera;
        this.terrainPatterns = {};
    }

    render() {
        const ctx = this.ctx;
        const state = getState();
        const viewport = this.camera.getViewport();

        ctx.save();
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);

        for (let r = 0; r < state.mapHeight; r++) {
            for (let q = 0; q < state.mapWidth; q++) {
                const { x, y } = axialToPixel(q, r);
                if (x < viewport.left || x > viewport.right || y < viewport.top || y > viewport.bottom) continue;

                const tile = state.tiles[hexKey(q, r)];
                if (!tile) continue;

                const player = state.players[state.currentPlayer];
                const key = hexKey(q, r);
                const isVisible = !player.isAI && player.visibleTiles.has(key);
                const isExplored = !player.isAI && player.exploredTiles.has(key);

                if (!isVisible && !isExplored && player.visibleTiles.size > 0) {
                    drawHex(ctx, x, y, '#1a1a2e', '#0d0d1a');
                    continue;
                }

                let color = tile.terrain.color;
                if (!isVisible && isExplored && player.visibleTiles.size > 0) {
                    color = this.darken(color, 0.78);
                }

                this.drawTerrainHex(ctx, x, y, tile, color);

                if (tile.owner !== null) {
                    this.drawBorder(ctx, x, y, q, r, tile.owner);
                }

                if (tile.resource && (isVisible || isExplored || player.visibleTiles.size === 0)) {
                    this.drawResource(ctx, x, y, tile.resource);
                }
            }
        }

        this.drawWorldLabels(ctx, state, viewport);
        this.drawCities(ctx, state, viewport);
        this.drawUnits(ctx, state, viewport);
        this.drawSelection(ctx, state);
        this.drawMovePath(ctx, state);

        ctx.restore();
    }

    drawTerrainHex(ctx, x, y, tile, color) {
        const terrain = tile.terrain;
        const isWater = terrain.naval;

        // Subtle deterministic per-hex shade so terrain reads like a painted map
        const n = ((tile.q * 73856093) ^ (tile.r * 19349663)) >>> 0;
        const shade = ((n % 100) / 100 - 0.5) * (isWater ? 0.06 : 0.12);
        const fill = this.shadeColor(color, shade);

        drawHex(ctx, x, y, fill, 'rgba(55, 42, 22, 0.10)');

        // Coastline: outline land hexes that touch the sea
        if (!isWater && terrain.passable) {
            let coastal = false;
            for (const nb of hexNeighbors(tile.q, tile.r)) {
                const nt = getTile(nb.q, nb.r);
                if (nt && nt.terrain.naval) { coastal = true; break; }
            }
            if (coastal) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                drawHex(ctx, x, y, null, '#7a6238');
                ctx.restore();
            }
        }

        ctx.save();
        ctx.globalAlpha = 0.35;

        if (terrain.name === 'Forest') {
            ctx.fillStyle = '#1b5e20';
            for (let i = 0; i < 3; i++) {
                const ox = (Math.sin(i * 2.5) * HEX_SIZE * 0.3);
                const oy = (Math.cos(i * 3.1) * HEX_SIZE * 0.3);
                ctx.beginPath();
                ctx.moveTo(x + ox, y + oy - 8);
                ctx.lineTo(x + ox - 5, y + oy + 4);
                ctx.lineTo(x + ox + 5, y + oy + 4);
                ctx.fill();
            }
        } else if (terrain.name === 'Mountains') {
            ctx.fillStyle = '#546e7a';
            ctx.beginPath();
            ctx.moveTo(x - 10, y + 8);
            ctx.lineTo(x, y - 10);
            ctx.lineTo(x + 10, y + 8);
            ctx.fill();
            ctx.fillStyle = '#eceff1';
            ctx.beginPath();
            ctx.moveTo(x - 3, y - 4);
            ctx.lineTo(x, y - 10);
            ctx.lineTo(x + 3, y - 4);
            ctx.fill();
        } else if (terrain.name === 'Hills') {
            ctx.fillStyle = '#6d4c41';
            ctx.beginPath();
            ctx.arc(x - 5, y + 3, 8, Math.PI, 0);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 7, y + 5, 6, Math.PI, 0);
            ctx.fill();
        } else if (terrain.name === 'Desert') {
            ctx.fillStyle = '#d4a853';
            for (let i = 0; i < 5; i++) {
                ctx.fillRect(x - 10 + i * 5, y + Math.sin(i) * 3, 2, 2);
            }
        } else if (terrain.name === 'Swamp') {
            ctx.fillStyle = '#33691e';
            for (let i = 0; i < 4; i++) {
                const sx = x - 8 + i * 6;
                ctx.fillRect(sx, y - 2, 1, 8);
                ctx.fillRect(sx - 2, y, 5, 1);
            }
        } else if (terrain.name === 'Snow' || terrain.name === 'Tundra') {
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(x - 8 + i * 6, y - 4 + (i % 2) * 8, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (terrain.name === 'River') {
            ctx.strokeStyle = '#1976d2';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 12, y);
            ctx.bezierCurveTo(x - 4, y - 6, x + 4, y + 6, x + 12, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawBorder(ctx, x, y, q, r, owner) {
        const state = getState();
        const color = (state.players[owner] && state.players[owner].color) || PLAYER_COLORS[owner];
        ctx.save();
        // Bold national territory fill
        ctx.globalAlpha = 0.42;
        drawHex(ctx, x, y, color, null);
        // Stronger outline on edges bordering a different power (national frontier)
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = color;
        const corners = getHexCorners(x, y);
        const dirs = hexNeighbors(q, r);
        for (let i = 0; i < 6; i++) {
            const nt = getTile(dirs[i].q, dirs[i].r);
            const sameOwner = nt && nt.owner === owner;
            if (!sameOwner) {
                const c1 = corners[(i + 5) % 6];
                const c2 = corners[i];
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(c1.x, c1.y);
                ctx.lineTo(c2.x, c2.y);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    drawResource(ctx, x, y, resource) {
        const res = RESOURCES[resource];
        if (!res) return;
        ctx.save();
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        ctx.fillText(res.icon, x + 12, y + 14);
        ctx.restore();
    }

    drawWorldLabels(ctx, state, viewport) {
        const zoom = this.camera.zoom;

        // Region names (faint, large, only when zoomed out a bit)
        if (zoom < 1.4) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(90, 70, 45, 0.35)';
            for (const lab of REGION_LABELS) {
                const { x, y } = axialToPixel(lab.q, lab.r);
                if (x < viewport.left || x > viewport.right || y < viewport.top || y > viewport.bottom) continue;
                ctx.font = `700 ${28 / Math.max(zoom, 0.6)}px "Cinzel", serif`;
                ctx.fillText(lab.name.split('').join(' '), x, y);
            }
            ctx.restore();
        }

        // Sea labels (italic, slate)
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(70, 95, 110, 0.6)';
        for (const lab of SEA_LABELS) {
            const { x, y } = axialToPixel(lab.q, lab.r);
            if (x < viewport.left || x > viewport.right || y < viewport.top || y > viewport.bottom) continue;
            ctx.font = `italic ${lab.size}px "EB Garamond", serif`;
            ctx.fillText(lab.name, x, y);
        }
        ctx.restore();

        // Decorative towns (skip any hex that already holds a real city)
        if (zoom > 0.7) {
            ctx.save();
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            for (const town of TOWNS) {
                const { x, y } = axialToPixel(town.q, town.r);
                if (x < viewport.left || x > viewport.right || y < viewport.top || y > viewport.bottom) continue;
                if (state.cities.some(c => c.q === town.q && c.r === town.r)) continue;
                const tile = getTile(town.q, town.r);
                if (!tile || !tile.terrain.passable || tile.terrain.naval) continue;

                ctx.fillStyle = 'rgba(60, 45, 28, 0.85)';
                ctx.beginPath();
                ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(240, 230, 207, 0.7)';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.font = '10px "EB Garamond", serif';
                ctx.fillStyle = 'rgba(45, 33, 20, 0.9)';
                ctx.fillText(town.name, x + 5, y + 0.5);
                ctx.fillStyle = 'rgba(240, 230, 207, 0.5)';
                ctx.fillText(town.name, x + 4.3, y - 0.2);
            }
            ctx.restore();
        }
    }

    drawCities(ctx, state, viewport) {
        for (const city of state.cities) {
            const { x, y } = axialToPixel(city.q, city.r);
            if (x < viewport.left || x > viewport.right || y < viewport.top || y > viewport.bottom) continue;

            const player = state.players[city.owner];
            const size = 8 + city.level * 3;

            ctx.save();

            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(x + 1, y + 1, size + 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 0.5;
            const iconSize = 10 + city.level * 2;
            ctx.font = `${iconSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const icons = ['\u{1F3D8}', '\u{1F3D9}', '\u{1F3DB}', '\u{1F3ED}', '\u{1F306}'];
            ctx.fillText(icons[city.level] || '\u{1F3D8}', x, y);

            ctx.font = 'bold 10px "Segoe UI", sans-serif';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(city.name, x, y - size - 6);
            ctx.fillText(city.name, x, y - size - 6);

            if (city.hp < city.maxHp) {
                const barW = size * 2;
                const barH = 3;
                const barX = x - barW / 2;
                const barY = y + size + 4;
                ctx.fillStyle = '#333';
                ctx.fillRect(barX, barY, barW, barH);
                ctx.fillStyle = city.hp / city.maxHp > 0.5 ? '#4caf50' : '#f44336';
                ctx.fillRect(barX, barY, barW * (city.hp / city.maxHp), barH);
            }

            ctx.restore();
        }
    }

    drawUnits(ctx, state, viewport) {
        for (const unit of state.units) {
            if (unit.hp <= 0) continue;
            const { x, y } = axialToPixel(unit.q, unit.r);
            if (x < viewport.left || x > viewport.right || y < viewport.top || y > viewport.bottom) continue;

            const player = state.players[unit.owner];
            const isSelected = state.selectedUnit === unit.id;
            const offsetX = 0;
            const offsetY = 10;

            ctx.save();

            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.roundRect(x - 13 + offsetX, y - 7 + offsetY, 26, 20, 3);
            ctx.fill();

            const gradient = ctx.createLinearGradient(x - 12, y - 6 + offsetY, x - 12, y + 12 + offsetY);
            gradient.addColorStop(0, this.lighten(player.color, 0.2));
            gradient.addColorStop(1, player.color);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x - 12 + offsetX, y - 8 + offsetY, 24, 18, 3);
            ctx.fill();

            ctx.strokeStyle = isSelected ? '#ffd700' : 'rgba(255,255,255,0.5)';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.stroke();

            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(unit.type.icon, x + offsetX, y + 1 + offsetY);

            const hpPct = unit.hp / unit.type.hp;
            const barW = 20;
            const barX = x - barW / 2 + offsetX;
            const barY = y + 8 + offsetY;
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(barX, barY, barW, 2);
            ctx.fillStyle = hpPct > 0.6 ? '#4caf50' : hpPct > 0.3 ? '#ff9800' : '#f44336';
            ctx.fillRect(barX, barY, barW * hpPct, 2);

            if (unit.movementLeft > 0 && unit.owner === state.currentPlayer) {
                ctx.fillStyle = '#76ff03';
                ctx.beginPath();
                ctx.arc(x + 12 + offsetX, y - 8 + offsetY, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            if (isSelected) {
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 2]);
                drawHex(ctx, x, y, null, '#ffd700');
                ctx.setLineDash([]);
            }

            ctx.restore();
        }
    }

    drawSelection(ctx, state) {
        if (state.hoveredHex) {
            const { x, y } = axialToPixel(state.hoveredHex.q, state.hoveredHex.r);
            ctx.save();
            ctx.globalAlpha = 0.3;
            drawHex(ctx, x, y, 'rgba(255,255,255,0.2)', '#ffffff');
            ctx.restore();
        }
    }

    drawMovePath(ctx, state) {
        if (!state.movePath || state.movePath.length < 2) return;
        ctx.save();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        const start = axialToPixel(state.movePath[0].q, state.movePath[0].r);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < state.movePath.length; i++) {
            const p = axialToPixel(state.movePath[i].q, state.movePath[i].r);
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        const last = state.movePath[state.movePath.length - 1];
        const lp = axialToPixel(last.q, last.r);
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(lp.x, lp.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.setLineDash([]);
        ctx.restore();
    }

    shadeColor(hex, delta) {
        if (!hex || hex[0] !== '#') return hex;
        const amt = Math.round(delta * 255);
        const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amt));
        const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amt));
        const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amt));
        return `rgb(${r},${g},${b})`;
    }

    darken(hex, amount) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.floor(r * amount)},${Math.floor(g * amount)},${Math.floor(b * amount)})`;
    }

    lighten(hex, amount) {
        const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 255 * amount);
        const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 255 * amount);
        const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 255 * amount);
        return `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
    }
}

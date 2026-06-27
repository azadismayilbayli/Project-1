import { pixelToAxial, hexKey, hexDistance } from '../utils.js';
import { getState } from './GameState.js';
import { getTile, getUnitsAt, getCityAt } from '../map/HexGrid.js';
import { findPath, moveUnit } from '../unit/Movement.js';
import { canAttack, resolveCombat, attackCity } from '../combat/CombatEngine.js';
import { EventBus } from '../events.js';
import { playSFX } from '../audio/AudioManager.js';

export function setupInput(canvas, camera) {
    let isPanning = false;
    let lastMouse = { x: 0, y: 0 };
    let rightDown = false;

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 2 || e.button === 1) {
            isPanning = true;
            lastMouse = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const dx = lastMouse.x - e.clientX;
            const dy = lastMouse.y - e.clientY;
            camera.pan(dx, dy);
            lastMouse = { x: e.clientX, y: e.clientY };
        }

        const rect = canvas.getBoundingClientRect();
        const world = camera.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        const hex = pixelToAxial(world.x, world.y);
        const state = getState();
        state.hoveredHex = hex;

        if (state.selectedUnit !== null) {
            const unit = state.units.find(u => u.id === state.selectedUnit);
            if (unit && unit.movementLeft > 0) {
                const path = findPath(unit, hex.q, hex.r);
                state.movePath = path;
            }
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 2 || e.button === 1) {
            isPanning = false;
        }
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        camera.zoomAt(e.deltaY, e.clientX, e.clientY);
    }, { passive: false });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const world = camera.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        const hex = pixelToAxial(world.x, world.y);
        handleClick(hex.q, hex.r);
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('keydown', (e) => {
        const panSpeed = 30;
        switch (e.key) {
            case 'ArrowLeft': case 'a': camera.pan(-panSpeed, 0); break;
            case 'ArrowRight': case 'd': camera.pan(panSpeed, 0); break;
            case 'ArrowUp': case 'w': camera.pan(0, -panSpeed); break;
            case 'ArrowDown': case 's': camera.pan(0, panSpeed); break;
            case 'Escape':
                const state = getState();
                state.selectedUnit = null;
                state.selectedCity = null;
                state.movePath = null;
                EventBus.emit('selection:clear');
                break;
            case 'f':
                fortifySelected();
                break;
        }
    });
}

function handleClick(q, r) {
    const state = getState();
    if (state.gameOver || state.animating) return;

    const tile = getTile(q, r);
    if (!tile) return;

    playSFX('click');

    const clickedUnits = getUnitsAt(q, r);
    const clickedCity = getCityAt(q, r);
    const selectedUnit = state.selectedUnit ? state.units.find(u => u.id === state.selectedUnit) : null;

    if (selectedUnit && selectedUnit.movementLeft > 0) {
        const enemyUnit = clickedUnits.find(u => u.owner !== state.currentPlayer);
        if (enemyUnit && canAttack(selectedUnit, enemyUnit)) {
            playSFX('attack');
            const result = resolveCombat(selectedUnit, enemyUnit);
            EventBus.emit('combat:display', result);
            state.movePath = null;
            if (result.cityCaptured) playSFX('capture');
            EventBus.emit('selection:update');
            return;
        }

        if (clickedCity && clickedCity.owner !== state.currentPlayer) {
            const dist = hexDistance({ q: selectedUnit.q, r: selectedUnit.r }, { q: clickedCity.q, r: clickedCity.r });
            if (dist <= selectedUnit.range) {
                playSFX('attack');
                const result = attackCity(selectedUnit, clickedCity);
                if (result && result.captured) playSFX('capture');
                EventBus.emit('selection:update');
                state.movePath = null;
                return;
            }
        }

        if (clickedUnits.length === 0 || clickedUnits.every(u => u.owner === state.currentPlayer)) {
            if (state.movePath && state.movePath.length > 1) {
                const last = state.movePath[state.movePath.length - 1];
                if (last.q === q && last.r === r) {
                    const moved = moveUnit(selectedUnit, state.movePath);
                    if (moved) {
                        playSFX('move');
                        state.movePath = null;
                        EventBus.emit('unit:moved', { unitId: selectedUnit.id });
                    }
                    return;
                }
            }
        }
    }

    const myUnit = clickedUnits.find(u => u.owner === state.currentPlayer);
    if (myUnit) {
        state.selectedUnit = myUnit.id;
        state.selectedCity = null;
        state.movePath = null;
        EventBus.emit('selection:unit', { unitId: myUnit.id });
        return;
    }

    if (clickedCity && clickedCity.owner === state.currentPlayer) {
        state.selectedCity = clickedCity.id;
        state.selectedUnit = null;
        state.movePath = null;
        EventBus.emit('selection:city', { cityId: clickedCity.id });
        return;
    }

    state.selectedUnit = null;
    state.selectedCity = null;
    state.movePath = null;
    EventBus.emit('selection:clear');
}

function fortifySelected() {
    const state = getState();
    if (!state.selectedUnit) return;
    const unit = state.units.find(u => u.id === state.selectedUnit);
    if (unit && unit.owner === state.currentPlayer) {
        unit.fortified = true;
        unit.movementLeft = 0;
        playSFX('click');
    }
}

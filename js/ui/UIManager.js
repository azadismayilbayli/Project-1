import { getState } from '../core/GameState.js';
import { EventBus } from '../events.js';
import { endTurn } from '../core/TurnManager.js';
import { RESOURCES, BUILDINGS, UNIT_TYPES, TECHS, CITY_LEVELS, GENERAL_TRAITS, GENERAL_RANKS, DIPLOMACY_ACTIONS } from '../config.js';
import { getCity, getCityIncome, startProduction, getPlayerCities } from '../city/City.js';
import { getUnit, getPlayerUnits, createUnit } from '../unit/Unit.js';
import { getGeneral, getPlayerGenerals, assignGeneral } from '../general/General.js';
import { canAfford, spendResources, calculateIncome } from '../economy/EconomyManager.js';
import { getAvailableTechs, startResearch, getTechProgress, hasTech } from '../tech/TechTree.js';
import { getDiplomacyStatus, declareWar, offerPeace, formAlliance, signNonAggression, signTradeAgreement, isAtWar } from '../diplomacy/DiplomacyManager.js';
import { getWeatherEffects, getSeasonName } from '../weather/WeatherSystem.js';
import { playSFX } from '../audio/AudioManager.js';
import { DOCTRINES } from '../features/Doctrines.js';
import { WONDERS, getAvailableWonders, startWonder, isWonderBuilt } from '../features/Wonders.js';
import { resolveChoice, getPendingChoice } from '../features/RandomEvents.js';
import { saveGame, loadGame } from '../core/SaveLoad.js';
import { getFlag } from '../features/Flags.js';

let notificationQueue = [];
let combatLog = [];

export function setupUI() {
    EventBus.on('selection:unit', updateBottomPanel);
    EventBus.on('selection:city', showCityPanel);
    EventBus.on('selection:clear', clearBottomPanel);
    EventBus.on('selection:update', updateBottomPanel);
    EventBus.on('unit:moved', updateBottomPanel);
    EventBus.on('turn:end', updateTopBar);
    EventBus.on('combat:display', showCombatResult);
    EventBus.on('combat:resolved', (r) => combatLog.unshift(r));
    EventBus.on('tech:completed', (data) => {
        const tech = TECHS[data.techKey];
        if (data.playerId === 0) addNotification(`Research complete: ${tech.name}!`, 'research');
    });
    EventBus.on('notification', (n) => addNotification(n.message, n.type));
    EventBus.on('game:over', showVictoryScreen);
    EventBus.on('diplomacy:war', (d) => {
        const s = getState();
        if (d.from === 0 || d.to === 0) addNotification(`War declared!`, 'war');
    });

    document.getElementById('btn-end-turn').addEventListener('click', () => endTurn());
    document.getElementById('btn-research').addEventListener('click', showTechPanel);
    document.getElementById('btn-diplomacy').addEventListener('click', showDiplomacyPanel);
    document.getElementById('btn-recruit').addEventListener('click', showRecruitPanel);
    document.getElementById('btn-generals').addEventListener('click', showGeneralsPanel);
    document.getElementById('btn-politics').addEventListener('click', showPoliticsPanel);
    document.getElementById('btn-wonders').addEventListener('click', showWondersPanel);
    document.getElementById('btn-save').addEventListener('click', () => { saveGame(); playSFX('click'); });
    document.getElementById('btn-load').addEventListener('click', () => { loadGame(); playSFX('click'); updateTopBar(); });
    document.getElementById('btn-help').addEventListener('click', () => { document.getElementById('help-overlay').style.display = 'flex'; });
    document.getElementById('close-help').addEventListener('click', () => { document.getElementById('help-overlay').style.display = 'none'; });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveGame(); }
        if (e.code === 'Space' && !e.target.matches('input,select,textarea')) { e.preventDefault(); endTurn(); }
        if (e.key === '?') { document.getElementById('help-overlay').style.display = 'flex'; }
    });

    EventBus.on('event:choice', showEventModal);
    EventBus.on('wonder:completed', (data) => {
        const w = WONDERS[data.wonderKey];
        const state = getState();
        const ownerName = state.players[data.owner].name;
        addNotification(`${w.icon} WONDER COMPLETE: ${ownerName} built ${w.name}!`, data.owner === 0 ? 'research' : 'war');
    });

    const closeButtons = document.querySelectorAll('.panel-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-panel').style.display = 'none';
        });
    });

    const player = getState().players[0];
    const flagEl = document.getElementById('player-flag');
    if (flagEl && player.nationKey) {
        flagEl.style.background = getFlag(player.nationKey);
    }
    const nameEl = document.getElementById('player-nation-name');
    if (nameEl) nameEl.textContent = player.name;

    updateTopBar();
    setInterval(updateTopBar, 500);
}

function updateTopBar() {
    const state = getState();
    if (!state || !state.players[0]) return;
    const p = state.players[0];

    document.getElementById('res-gold').textContent = Math.floor(p.resources.gold);
    document.getElementById('res-food').textContent = Math.floor(p.resources.food);
    document.getElementById('res-science').textContent = Math.floor(p.resources.science);
    document.getElementById('res-production').textContent = Math.floor(p.resources.production);
    document.getElementById('turn-counter').textContent = `Turn ${state.turn}`;
    document.getElementById('war-support').textContent = `${Math.floor(p.politics.warSupport)}%`;

    const weather = state.weather.current;
    document.getElementById('weather-display').textContent = `${weather.icon} ${weather.name}`;
    document.getElementById('season-display').textContent = getSeasonName();

    const techProg = getTechProgress(0);
    const techEl = document.getElementById('research-progress');
    if (techProg) {
        techEl.textContent = `${TECHS[techProg.techKey].name}: ${techProg.percent}%`;
    } else {
        techEl.textContent = 'No Research';
    }

    updateNotifications();
}

function updateBottomPanel() {
    const state = getState();
    const panel = document.getElementById('bottom-panel');

    if (state.selectedUnit) {
        const unit = state.units.find(u => u.id === state.selectedUnit);
        if (!unit) { panel.innerHTML = ''; return; }

        const general = unit.generalId ? getGeneral(unit.generalId) : null;
        const generalInfo = general
            ? `<div class="unit-general"><span class="general-icon">★</span> ${general.name} (${GENERAL_RANKS[general.rank].name})</div>`
            : '';

        panel.innerHTML = `
            <div class="unit-info">
                <div class="unit-header">
                    <span class="unit-icon">${unit.type.icon}</span>
                    <div>
                        <div class="unit-name">${unit.type.name}</div>
                        <div class="unit-category">${unit.type.category.toUpperCase()}</div>
                    </div>
                </div>
                <div class="unit-stats">
                    <div class="stat"><span class="stat-label">HP</span><div class="stat-bar"><div class="stat-fill hp" style="width:${(unit.hp/unit.maxHp)*100}%"></div></div><span class="stat-val">${unit.hp}/${unit.maxHp}</span></div>
                    <div class="stat"><span class="stat-label">ATK</span><span class="stat-val">${unit.attack}</span></div>
                    <div class="stat"><span class="stat-label">DEF</span><span class="stat-val">${unit.defense}</span></div>
                    <div class="stat"><span class="stat-label">MOV</span><span class="stat-val">${unit.movementLeft}/${unit.movement}</span></div>
                    <div class="stat"><span class="stat-label">RNG</span><span class="stat-val">${unit.range}</span></div>
                    <div class="stat"><span class="stat-label">MRL</span><div class="stat-bar"><div class="stat-fill morale" style="width:${unit.morale}%"></div></div><span class="stat-val">${Math.floor(unit.morale)}</span></div>
                    <div class="stat"><span class="stat-label">SUP</span><div class="stat-bar"><div class="stat-fill supply" style="width:${unit.supply}%"></div></div><span class="stat-val">${Math.floor(unit.supply)}</span></div>
                    <div class="stat"><span class="stat-label">XP</span><span class="stat-val">${unit.experience}</span></div>
                </div>
                ${generalInfo}
                <div class="unit-actions">
                    <button class="action-btn" onclick="document.getElementById('bottom-panel').querySelector('.action-btn').blur(); window.fortifyUnit && window.fortifyUnit()">Fortify (F)</button>
                </div>
            </div>
        `;
    } else if (state.selectedCity) {
        showCityPanel();
    } else {
        panel.innerHTML = '<div class="no-selection">Select a unit or city</div>';
    }
}

function showCityPanel() {
    const state = getState();
    const city = state.cities.find(c => c.id === state.selectedCity);
    if (!city) return;

    const panel = document.getElementById('city-panel');
    const level = CITY_LEVELS[city.level];
    const income = getCityIncome(city);
    const player = state.players[city.owner];

    const availableBuildings = Object.entries(BUILDINGS).filter(([key, b]) => {
        if (city.buildings.includes(key)) return false;
        if (b.prereqTech && !player.techs.includes(b.prereqTech)) return false;
        return true;
    });

    const availableUnits = Object.entries(UNIT_TYPES).filter(([key, u]) => {
        if (u.prereqTech && !player.techs.includes(u.prereqTech)) return false;
        return true;
    });

    let buildingsHTML = city.buildings.map(b => {
        const bd = BUILDINGS[b];
        return `<div class="building-item built">${bd ? bd.name : b}</div>`;
    }).join('');

    let availBuildHTML = availableBuildings.map(([key, b]) => {
        const affordable = canAfford(0, b.cost);
        return `<div class="building-item available ${affordable ? '' : 'unaffordable'}" data-building="${key}">
            <span>${b.name}</span>
            <span class="build-cost">${Object.entries(b.cost).map(([r,v]) => `${v} ${r}`).join(', ')}</span>
        </div>`;
    }).join('');

    let unitBuildHTML = availableUnits.slice(0, 8).map(([key, u]) => {
        const affordable = canAfford(0, u.cost);
        return `<div class="building-item available ${affordable ? '' : 'unaffordable'}" data-unit="${key}">
            <span>${u.icon} ${u.name}</span>
            <span class="build-cost">${Object.entries(u.cost).map(([r,v]) => `${v} ${r}`).join(', ')}</span>
        </div>`;
    }).join('');

    panel.innerHTML = `
        <div class="city-header">
            <h2>${city.name}</h2>
            <span class="city-level">${level.name} (Lv ${city.level + 1})</span>
            <button class="panel-close" id="close-city">X</button>
        </div>
        <div class="city-stats-grid">
            <div class="city-stat"><span>Population</span><span>${city.population}</span></div>
            <div class="city-stat"><span>HP</span><span>${city.hp}/${city.maxHp}</span></div>
            <div class="city-stat"><span>Gold/turn</span><span>+${income.gold}</span></div>
            <div class="city-stat"><span>Food/turn</span><span>+${income.food}</span></div>
            <div class="city-stat"><span>Production/turn</span><span>+${income.production}</span></div>
            <div class="city-stat"><span>Science/turn</span><span>+${income.science}</span></div>
        </div>
        ${city.currentProduction ? `<div class="production-current">Building: ${city.currentProduction} (${Math.floor(city.productionProgress)}/${BUILDINGS[city.currentProduction]?.cost?.production || 50})</div>` : ''}
        <div class="city-section">
            <h3>Buildings</h3>
            <div class="building-list">${buildingsHTML || '<div class="empty">No buildings yet</div>'}</div>
        </div>
        <div class="city-section">
            <h3>Build</h3>
            <div class="building-list">${availBuildHTML}</div>
        </div>
        <div class="city-section">
            <h3>Recruit Units</h3>
            <div class="building-list">${unitBuildHTML}</div>
        </div>
    `;

    panel.style.display = 'block';

    document.getElementById('close-city').addEventListener('click', () => {
        panel.style.display = 'none';
    });

    panel.querySelectorAll('[data-building]').forEach(el => {
        el.addEventListener('click', () => {
            const key = el.dataset.building;
            const b = BUILDINGS[key];
            if (canAfford(0, b.cost)) {
                spendResources(0, b.cost);
                startProduction(city, key);
                playSFX('build');
                showCityPanel();
                updateTopBar();
            }
        });
    });

    panel.querySelectorAll('[data-unit]').forEach(el => {
        el.addEventListener('click', () => {
            const key = el.dataset.unit;
            const u = UNIT_TYPES[key];
            if (canAfford(0, u.cost)) {
                spendResources(0, u.cost);
                createUnit(key, 0, city.q, city.r);
                playSFX('build');
                showCityPanel();
                updateTopBar();
            }
        });
    });
}

function showTechPanel() {
    const state = getState();
    const panel = document.getElementById('tech-panel');
    const available = getAvailableTechs(0);
    const researched = state.players[0].techs;
    const progress = getTechProgress(0);

    const categories = ['military', 'economy', 'infrastructure', 'science', 'government', 'industry'];

    let html = `<div class="tech-header"><h2>Technology</h2><button class="panel-close" id="close-tech">X</button></div>`;

    if (progress) {
        html += `<div class="tech-progress">Researching: <strong>${TECHS[progress.techKey].name}</strong> - ${progress.percent}% (${progress.progress}/${progress.total})</div>`;
    }

    for (const cat of categories) {
        const catTechs = Object.entries(TECHS).filter(([, t]) => t.category === cat);
        if (catTechs.length === 0) continue;

        html += `<div class="tech-category"><h3>${cat.charAt(0).toUpperCase() + cat.slice(1)}</h3><div class="tech-grid">`;
        for (const [key, tech] of catTechs) {
            const isResearched = researched.includes(key);
            const isAvailable = available.some(t => t.key === key);
            const isCurrently = progress && progress.techKey === key;
            const cls = isResearched ? 'researched' : isCurrently ? 'researching' : isAvailable ? 'available' : 'locked';

            html += `<div class="tech-item ${cls}" data-tech="${key}">
                <div class="tech-name">${tech.name}</div>
                <div class="tech-cost">Cost: ${tech.cost}</div>
                <div class="tech-desc">${tech.description}</div>
                ${tech.unlocks.length > 0 ? `<div class="tech-unlocks">Unlocks: ${tech.unlocks.join(', ')}</div>` : ''}
            </div>`;
        }
        html += `</div></div>`;
    }

    panel.innerHTML = html;
    panel.style.display = 'block';

    document.getElementById('close-tech').addEventListener('click', () => panel.style.display = 'none');

    panel.querySelectorAll('.tech-item.available').forEach(el => {
        el.addEventListener('click', () => {
            startResearch(0, el.dataset.tech);
            playSFX('research');
            showTechPanel();
            updateTopBar();
        });
    });
}

function showDiplomacyPanel() {
    const state = getState();
    const panel = document.getElementById('diplomacy-panel');
    const statuses = getDiplomacyStatus(0);

    let html = `<div class="tech-header"><h2>Diplomacy</h2><button class="panel-close" id="close-diplo">X</button></div>`;

    for (const s of statuses) {
        const relColor = s.relation > 30 ? '#4caf50' : s.relation < -30 ? '#f44336' : '#ff9800';
        const statusText = s.atWar ? 'AT WAR' : s.allied ? 'ALLIED' : s.nonAggression ? 'NON-AGGRESSION' : s.trade ? 'TRADING' : 'NEUTRAL';
        const statusClass = s.atWar ? 'war' : s.allied ? 'allied' : 'neutral';

        html += `<div class="diplo-nation">
            <div class="diplo-header">
                <span class="diplo-color" style="background:${s.color}"></span>
                <span class="diplo-name">${s.name}</span>
                <span class="diplo-relation" style="color:${relColor}">${s.relation > 0 ? '+' : ''}${s.relation}</span>
                <span class="diplo-status ${statusClass}">${statusText}</span>
            </div>
            <div class="diplo-actions">
                ${!s.atWar ? `<button class="diplo-btn war" data-action="war" data-player="${s.playerId}">Declare War</button>` : ''}
                ${s.atWar ? `<button class="diplo-btn peace" data-action="peace" data-player="${s.playerId}">Offer Peace</button>` : ''}
                ${!s.atWar && !s.allied ? `<button class="diplo-btn ally" data-action="alliance" data-player="${s.playerId}">Alliance</button>` : ''}
                ${!s.atWar && !s.nonAggression ? `<button class="diplo-btn nap" data-action="nap" data-player="${s.playerId}">Non-Aggression</button>` : ''}
                ${!s.atWar && !s.trade ? `<button class="diplo-btn trade" data-action="trade" data-player="${s.playerId}">Trade</button>` : ''}
            </div>
        </div>`;
    }

    panel.innerHTML = html;
    panel.style.display = 'block';

    document.getElementById('close-diplo').addEventListener('click', () => panel.style.display = 'none');

    panel.querySelectorAll('.diplo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const pid = parseInt(btn.dataset.player);
            switch (action) {
                case 'war': declareWar(0, pid); break;
                case 'peace': offerPeace(0, pid); break;
                case 'alliance': formAlliance(0, pid); break;
                case 'nap': signNonAggression(0, pid); break;
                case 'trade': signTradeAgreement(0, pid); break;
            }
            playSFX('click');
            showDiplomacyPanel();
        });
    });
}

function showRecruitPanel() {
    const state = getState();
    const panel = document.getElementById('recruit-panel');
    const player = state.players[0];
    const cities = getPlayerCities(0);

    let html = `<div class="tech-header"><h2>Recruitment</h2><button class="panel-close" id="close-recruit">X</button></div>`;

    const availableUnits = Object.entries(UNIT_TYPES).filter(([key, u]) => {
        if (u.prereqTech && !player.techs.includes(u.prereqTech)) return false;
        return true;
    });

    const categories = ['ground', 'armor', 'artillery', 'air', 'naval', 'support'];
    for (const cat of categories) {
        const catUnits = availableUnits.filter(([, u]) => u.category === cat);
        if (catUnits.length === 0) continue;

        html += `<div class="tech-category"><h3>${cat.charAt(0).toUpperCase() + cat.slice(1)}</h3><div class="recruit-grid">`;
        for (const [key, u] of catUnits) {
            const affordable = canAfford(0, u.cost);
            html += `<div class="recruit-item ${affordable ? '' : 'unaffordable'}">
                <div class="recruit-icon">${u.icon}</div>
                <div class="recruit-info">
                    <div class="recruit-name">${u.name}</div>
                    <div class="recruit-stats">HP:${u.hp} ATK:${u.atk} DEF:${u.def} MOV:${u.mov} RNG:${u.range}</div>
                    <div class="recruit-cost">${Object.entries(u.cost).map(([r,v]) => `${v} ${RESOURCES[r]?.icon || r}`).join(' ')}</div>
                </div>
                <div class="recruit-cities">
                    ${cities.map(c => `<button class="recruit-btn ${affordable ? '' : 'disabled'}" data-unit="${key}" data-city="${c.id}">${c.name}</button>`).join('')}
                </div>
            </div>`;
        }
        html += `</div></div>`;
    }

    panel.innerHTML = html;
    panel.style.display = 'block';

    document.getElementById('close-recruit').addEventListener('click', () => panel.style.display = 'none');

    panel.querySelectorAll('.recruit-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            const unitKey = btn.dataset.unit;
            const cityId = parseInt(btn.dataset.city);
            const city = state.cities.find(c => c.id === cityId);
            const u = UNIT_TYPES[unitKey];
            if (city && canAfford(0, u.cost)) {
                spendResources(0, u.cost);
                createUnit(unitKey, 0, city.q, city.r);
                playSFX('build');
                showRecruitPanel();
                updateTopBar();
            }
        });
    });
}

function showGeneralsPanel() {
    const state = getState();
    const panel = document.getElementById('generals-panel');
    const generals = getPlayerGenerals(0);
    const units = getPlayerUnits(0).filter(u => !u.generalId);

    let html = `<div class="tech-header"><h2>Generals</h2><button class="panel-close" id="close-generals">X</button></div>`;

    if (generals.length === 0) {
        html += '<div class="empty-panel">No generals available</div>';
    }

    for (const gen of generals) {
        const rank = GENERAL_RANKS[gen.rank];
        const traits = gen.traits.map(t => GENERAL_TRAITS[t]?.name || t).join(', ');
        const assignedUnit = gen.assignedUnit ? state.units.find(u => u.id === gen.assignedUnit) : null;

        html += `<div class="general-card">
            <div class="general-portrait" style="background:hsl(${gen.portraitIndex * 30}, 40%, 35%)">
                <span class="portrait-star">★</span>
            </div>
            <div class="general-info">
                <div class="general-name">${gen.name}</div>
                <div class="general-rank">${rank.name} (XP: ${gen.experience}/${GENERAL_RANKS[Math.min(gen.rank + 1, GENERAL_RANKS.length - 1)].xpRequired})</div>
                <div class="general-stats">
                    <span>Lead: ${gen.leadership}</span>
                    <span>Strat: ${gen.strategy}</span>
                    <span>Log: ${gen.logistics}</span>
                    <span>Aggr: ${gen.aggression}</span>
                </div>
                <div class="general-traits">${traits}</div>
                <div class="general-bio">${gen.biography}</div>
                <div class="general-assigned">${assignedUnit ? `Assigned to: ${assignedUnit.type.name}` : 'Unassigned'}</div>
                ${!gen.assignedUnit && units.length > 0 ? `
                    <select class="assign-select" data-general="${gen.id}">
                        <option value="">Assign to unit...</option>
                        ${units.map(u => `<option value="${u.id}">${u.type.name} (${u.q},${u.r})</option>`).join('')}
                    </select>
                ` : ''}
            </div>
        </div>`;
    }

    panel.innerHTML = html;
    panel.style.display = 'block';

    document.getElementById('close-generals').addEventListener('click', () => panel.style.display = 'none');

    panel.querySelectorAll('.assign-select').forEach(sel => {
        sel.addEventListener('change', () => {
            if (sel.value) {
                assignGeneral(parseInt(sel.dataset.general), parseInt(sel.value));
                playSFX('click');
                showGeneralsPanel();
            }
        });
    });
}

function showPoliticsPanel() {
    const state = getState();
    const panel = document.getElementById('politics-panel');
    const pol = state.players[0].politics;
    const cities = getPlayerCities(0);
    const units = getPlayerUnits(0);
    const income = calculateIncome(0);

    const doctrine = state.players[0].doctrine ? DOCTRINES[state.players[0].doctrine] : null;
    const doctrineHTML = doctrine ? `
        <div class="nation-doctrine" style="border-color:${doctrine.color}80">
            <span class="nd-icon">${doctrine.icon}</span>
            <div><div class="nd-name" style="color:${doctrine.color}">${doctrine.name}</div>
            <div class="nd-desc">${doctrine.description}</div></div>
        </div>` : '';

    panel.innerHTML = `
        <div class="tech-header"><h2>Nation Overview</h2><button class="panel-close" id="close-politics">X</button></div>
        ${doctrineHTML}
        <div class="politics-grid">
            <div class="pol-stat">
                <div class="pol-label">Government Stability</div>
                <div class="pol-bar"><div class="pol-fill" style="width:${pol.stability}%; background:${pol.stability > 50 ? '#4caf50' : '#f44336'}"></div></div>
                <div class="pol-val">${Math.floor(pol.stability)}%</div>
            </div>
            <div class="pol-stat">
                <div class="pol-label">War Support</div>
                <div class="pol-bar"><div class="pol-fill" style="width:${pol.warSupport}%; background:#ff9800"></div></div>
                <div class="pol-val">${Math.floor(pol.warSupport)}%</div>
            </div>
            <div class="pol-stat">
                <div class="pol-label">Population Happiness</div>
                <div class="pol-bar"><div class="pol-fill" style="width:${pol.happiness}%; background:#2196f3"></div></div>
                <div class="pol-val">${Math.floor(pol.happiness)}%</div>
            </div>
            <div class="pol-stat">
                <div class="pol-label">Corruption</div>
                <div class="pol-bar"><div class="pol-fill" style="width:${pol.corruption}%; background:#9c27b0"></div></div>
                <div class="pol-val">${Math.floor(pol.corruption)}%</div>
            </div>
            <div class="pol-stat">
                <div class="pol-label">National Unity</div>
                <div class="pol-bar"><div class="pol-fill" style="width:${pol.nationalUnity}%; background:#00bcd4"></div></div>
                <div class="pol-val">${Math.floor(pol.nationalUnity)}%</div>
            </div>
        </div>
        <div class="nation-stats">
            <div class="nation-stat">Cities: ${cities.length}</div>
            <div class="nation-stat">Army: ${units.length} units</div>
            <div class="nation-stat">Income: +${income.gold} gold/turn</div>
            <div class="nation-stat">Food: +${income.food}/turn</div>
            <div class="nation-stat">Industry: +${income.production}/turn</div>
            <div class="nation-stat">Science: +${income.science}/turn</div>
        </div>
    `;
    panel.style.display = 'block';

    document.getElementById('close-politics').addEventListener('click', () => panel.style.display = 'none');
}

function showWondersPanel() {
    const panel = document.getElementById('wonders-panel');
    const state = getState();
    const wonders = getAvailableWonders();
    const builtWonders = state.wonders || [];
    const cities = getPlayerCities(0);

    let html = `<div class="tech-header"><h2>\u{1F3DB} World Wonders</h2><button class="panel-close" id="close-wonders">X</button></div>`;
    html += `<p class="wonder-intro">Only one of each wonder can exist. Be the first to complete it and claim a permanent empire-wide bonus.</p>`;

    if (builtWonders.length > 0) {
        html += `<div class="tech-category"><h3>Completed</h3>`;
        for (const bw of builtWonders) {
            const w = WONDERS[bw.key];
            const owner = state.players[bw.owner];
            html += `<div class="wonder-built" style="border-color:${owner.color}40">
                <span class="wonder-bicon">${w.icon}</span>
                <div><div class="wonder-bname">${w.name}</div>
                <div class="wonder-bowner" style="color:${owner.color}">Built by ${owner.name} (Turn ${bw.turn})</div></div>
            </div>`;
        }
        html += `</div>`;
    }

    html += `<div class="tech-category"><h3>Available to Build</h3>`;
    for (const w of wonders) {
        const costStr = Object.entries(w.cost).map(([r, v]) => `${v} ${RESOURCES[r]?.icon || r}`).join('  ');
        const inProgress = cities.find(c => c.wonderInProgress === w.key);
        html += `<div class="wonder-card ${w.claimed ? 'claimed' : ''}">
            <div class="wonder-head">
                <span class="wonder-bicon">${w.icon}</span>
                <span class="wonder-name">${w.name}</span>
            </div>
            <div class="wonder-desc">${w.description}</div>
            <div class="wonder-cost">${costStr}</div>
            ${inProgress ? `<div class="wonder-progress">Building in ${inProgress.name}: ${Math.floor(inProgress.wonderProgress)}/${w.cost.production}</div>` : `
            <div class="wonder-cities">
                ${cities.map(c => `<button class="wonder-btn" data-wonder="${w.key}" data-city="${c.id}" ${c.wonderInProgress ? 'disabled' : ''}>Build in ${c.name}</button>`).join('')}
            </div>`}
        </div>`;
    }
    html += `</div>`;

    panel.innerHTML = html;
    panel.style.display = 'block';
    document.getElementById('close-wonders').addEventListener('click', () => panel.style.display = 'none');

    panel.querySelectorAll('.wonder-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            const city = state.cities.find(c => c.id === parseInt(btn.dataset.city));
            const w = WONDERS[btn.dataset.wonder];
            if (city && canAfford(0, w.cost)) {
                spendResources(0, w.cost);
                startWonder(city, btn.dataset.wonder);
                playSFX('build');
                showWondersPanel();
                updateTopBar();
            } else {
                addNotification('Not enough resources for this wonder.', 'war');
            }
        });
    });
}

function showEventModal(data) {
    const ev = data.event;
    const modal = document.getElementById('event-modal');
    document.getElementById('event-icon').textContent = ev.icon;
    document.getElementById('event-title').textContent = ev.name;
    document.getElementById('event-text').textContent = ev.text;

    const choicesEl = document.getElementById('event-choices');
    choicesEl.innerHTML = ev.choices.map((c, i) => `<button class="event-choice-btn" data-idx="${i}">${c.label}</button>`).join('');

    choicesEl.querySelectorAll('.event-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            resolveChoice(parseInt(btn.dataset.idx));
            playSFX('click');
            modal.style.display = 'none';
            updateTopBar();
        });
    });

    modal.style.display = 'flex';
    playSFX('research');
}

function showCombatResult(result) {
    const el = document.getElementById('combat-popup');
    el.innerHTML = `
        <div class="combat-result">
            <div class="combat-title">${result.isCrit ? 'CRITICAL HIT!' : 'Battle Report'}</div>
            <div class="combat-detail">Damage dealt: ${result.damageToDefender}</div>
            <div class="combat-detail">Damage taken: ${result.damageToAttacker}</div>
            ${result.flankers > 0 ? `<div class="combat-detail">Flanking units: ${result.flankers}</div>` : ''}
            ${result.terrainDef > 0 ? `<div class="combat-detail">Terrain defense: +${Math.floor(result.terrainDef * 100)}%</div>` : ''}
            ${result.defenderKilled ? '<div class="combat-detail kill">Enemy destroyed!</div>' : ''}
            ${result.attackerKilled ? '<div class="combat-detail kill">Unit lost!</div>' : ''}
            ${result.cityCaptured ? '<div class="combat-detail capture">City captured!</div>' : ''}
        </div>
    `;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function showVictoryScreen(data) {
    const state = getState();
    const winner = state.players[data.winner];
    const overlay = document.getElementById('victory-overlay');
    overlay.innerHTML = `
        <div class="victory-content">
            <h1>${data.winner === 0 ? 'VICTORY!' : 'DEFEAT'}</h1>
            <p>${winner.name} ${data.winner === 0 ? 'has conquered all!' : 'has won the war.'}</p>
            <p>Turn ${state.turn}</p>
            <button onclick="location.reload()">Play Again</button>
        </div>
    `;
    overlay.style.display = 'flex';
    playSFX(data.winner === 0 ? 'victory' : 'defeat');
}

function addNotification(message, type = 'info') {
    notificationQueue.push({ message, type, time: Date.now() });
    if (notificationQueue.length > 5) notificationQueue.shift();
    updateNotifications();
}

function updateNotifications() {
    const container = document.getElementById('notifications');
    const now = Date.now();
    notificationQueue = notificationQueue.filter(n => now - n.time < 8000);

    container.innerHTML = notificationQueue.map(n => `
        <div class="notification ${n.type}">${n.message}</div>
    `).join('');
}

function clearBottomPanel() {
    const panel = document.getElementById('bottom-panel');
    panel.innerHTML = '<div class="no-selection">Select a unit or city</div>';
    document.getElementById('city-panel').style.display = 'none';
}

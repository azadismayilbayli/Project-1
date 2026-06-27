// Random Events - dynamic crises and opportunities that fire each turn.
// Some are auto-resolved; the most interesting ones present the human player
// with a CHOICE that has real strategic consequences.

import { getState } from '../core/GameState.js';
import { getPlayerCities } from '../city/City.js';
import { getPlayerUnits, createUnit } from '../unit/Unit.js';
import { createGeneral } from '../general/General.js';
import { EventBus } from '../events.js';

// Auto events: applied immediately, just a notification.
const AUTO_EVENTS = [
    {
        id: 'bountifulHarvest', name: 'Bountiful Harvest', icon: '\u{1F33E}',
        weight: 10, condition: (p) => getPlayerCities(p.id).length > 0,
        apply: (p) => { p.resources.food += 80; return 'A bountiful harvest! +80 food.'; }
    },
    {
        id: 'goldRush', name: 'Gold Rush', icon: '\u{1F4B0}',
        weight: 8, condition: () => true,
        apply: (p) => { p.resources.gold += 150; return 'Prospectors strike gold! +150 gold.'; }
    },
    {
        id: 'plague', name: 'Plague Outbreak', icon: '\u{1F480}',
        weight: 6, condition: (p) => getPlayerCities(p.id).length > 0,
        apply: (p) => {
            const cities = getPlayerCities(p.id);
            const city = cities[Math.floor(Math.random() * cities.length)];
            city.population = Math.max(1, city.population - 2);
            p.politics.happiness -= 8;
            return `A plague strikes ${city.name}! Population and happiness fall.`;
        }
    },
    {
        id: 'inventor', name: 'Brilliant Inventor', icon: '\u{1F4A1}',
        weight: 7, condition: () => true,
        apply: (p) => { p.resources.science += 100; return 'A brilliant inventor emerges! +100 science.'; }
    },
    {
        id: 'desertion', name: 'Desertion', icon: '\u{1F3F3}',
        weight: 5, condition: (p) => getPlayerUnits(p.id).length > 2,
        apply: (p) => {
            const units = getPlayerUnits(p.id).filter(u => u.morale < 50);
            if (units.length === 0) return null;
            const u = units[Math.floor(Math.random() * units.length)];
            u.hp = Math.max(1, Math.floor(u.hp * 0.6));
            return `Low morale causes desertion in your ${u.type.name}!`;
        }
    },
    {
        id: 'industrialBoom', name: 'Industrial Boom', icon: '\u{2699}',
        weight: 7, condition: (p) => getPlayerCities(p.id).length > 1,
        apply: (p) => { p.resources.production += 120; return 'Factories work overtime! +120 production.'; }
    },
    {
        id: 'patriotism', name: 'Wave of Patriotism', icon: '\u{1F396}',
        weight: 6, condition: () => true,
        apply: (p) => { p.politics.warSupport = Math.min(100, p.politics.warSupport + 15); p.politics.nationalUnity = Math.min(100, p.politics.nationalUnity + 10); return 'A wave of patriotism sweeps the nation! War support rises.'; }
    },
    {
        id: 'resourceFind', name: 'Rich Mineral Vein', icon: '\u{1F48E}',
        weight: 6, condition: () => true,
        apply: (p) => { p.resources.iron += 15; p.resources.oil += 8; return 'Surveyors find a rich mineral vein! +15 iron, +8 oil.'; }
    },
    {
        id: 'corruption', name: 'Corruption Scandal', icon: '\u{1F4B8}',
        weight: 5, condition: (p) => p.resources.gold > 100,
        apply: (p) => {
            const loss = Math.floor(p.resources.gold * 0.2);
            p.resources.gold -= loss;
            p.politics.corruption = Math.min(100, p.politics.corruption + 10);
            return `A corruption scandal costs the treasury ${loss} gold!`;
        }
    }
];

// Choice events: only for the human player, pause for a decision.
const CHOICE_EVENTS = [
    {
        id: 'wanderingGeneral', name: 'A Wandering General', icon: '\u{2B50}',
        weight: 5, condition: (p) => getPlayerCities(p.id).length > 0,
        text: 'A famed military commander offers to serve your nation — for a price. Their reputation precedes them.',
        choices: [
            { label: 'Hire them (200 gold)', apply: (p) => {
                if (p.resources.gold < 200) return 'You cannot afford the fee. The general moves on.';
                p.resources.gold -= 200;
                const g = createGeneral(p.id);
                g.experience = 300; g.rank = 2; g.leadership += 3;
                return `${g.name} joins your ranks as a seasoned commander!`;
            }},
            { label: 'Decline', apply: () => 'You let the wandering general pass by.' }
        ]
    },
    {
        id: 'refugees', name: 'Refugees at the Border', icon: '\u{1F465}',
        weight: 6, condition: (p) => getPlayerCities(p.id).length > 0,
        text: 'A column of refugees seeks shelter in your lands. They could bolster your population — or strain your resources.',
        choices: [
            { label: 'Welcome them', apply: (p) => {
                const cities = getPlayerCities(p.id);
                cities[0].population += 3;
                p.politics.happiness -= 5;
                p.resources.food -= 30;
                return 'You welcome the refugees. Population grows, but resources are strained.';
            }},
            { label: 'Turn them away', apply: (p) => {
                p.politics.happiness += 3;
                p.politics.nationalUnity -= 5;
                return 'You turn the refugees away. Some citizens disapprove.';
            }}
        ]
    },
    {
        id: 'ancientRuins', name: 'Ancient Ruins Discovered', icon: '\u{1F3DB}',
        weight: 5, condition: () => true,
        text: 'Explorers uncover ruins of a forgotten civilization. Do you fund a full excavation, or strip it for quick riches?',
        choices: [
            { label: 'Fund excavation (gain science)', apply: (p) => { p.resources.science += 200; return 'The excavation yields priceless knowledge! +200 science.'; }},
            { label: 'Strip for treasure (gain gold)', apply: (p) => { p.resources.gold += 250; return 'You plunder the ruins for treasure! +250 gold.'; }}
        ]
    },
    {
        id: 'militaryParade', name: 'Call for a Military Parade', icon: '\u{1F396}',
        weight: 5, condition: (p) => getPlayerUnits(p.id).length > 1,
        text: 'Your generals request a grand military parade to inspire the populace. It would cost gold but raise morale.',
        choices: [
            { label: 'Hold the parade (100 gold)', apply: (p) => {
                if (p.resources.gold < 100) return 'Not enough gold for a parade.';
                p.resources.gold -= 100;
                getPlayerUnits(p.id).forEach(u => u.morale = Math.min(100, u.morale + 25));
                p.politics.warSupport = Math.min(100, p.politics.warSupport + 10);
                return 'The parade is a triumph! All units gain morale and war support rises.';
            }},
            { label: 'Save the gold', apply: () => 'You decline the parade to save funds.' }
        ]
    },
    {
        id: 'spyCaught', name: 'Enemy Spy Captured', icon: '\u{1F575}',
        weight: 4, condition: () => true,
        text: 'Your counter-intelligence has captured an enemy spy. How do you handle the situation?',
        choices: [
            { label: 'Execute publicly (war support)', apply: (p) => { p.politics.warSupport = Math.min(100, p.politics.warSupport + 12); return 'The public execution rallies the nation. +War support.'; }},
            { label: 'Turn them (gain intel/science)', apply: (p) => { p.resources.science += 120; return 'You turn the spy into a double agent. +120 science from stolen secrets.'; }}
        ]
    }
];

let pendingChoice = null;

export function processRandomEvents() {
    const state = getState();

    for (let pid = 0; pid < state.players.length; pid++) {
        const player = state.players[pid];
        if (player.defeated) continue;

        // ~22% chance of an event per player per turn
        if (Math.random() > 0.22) continue;

        const isHuman = pid === 0;

        // Human players sometimes get choice events
        if (isHuman && Math.random() < 0.4) {
            const valid = CHOICE_EVENTS.filter(e => e.condition(player));
            if (valid.length > 0) {
                const ev = pickWeighted(valid);
                pendingChoice = { event: ev, playerId: pid };
                EventBus.emit('event:choice', { event: ev });
                continue;
            }
        }

        const valid = AUTO_EVENTS.filter(e => e.condition(player));
        if (valid.length === 0) continue;
        const ev = pickWeighted(valid);
        const message = ev.apply(player);
        if (message && isHuman) {
            EventBus.emit('notification', { message: `${ev.icon} ${ev.name}: ${message}`, type: 'event' });
        }
    }
}

export function resolveChoice(choiceIndex) {
    if (!pendingChoice) return;
    const { event, playerId } = pendingChoice;
    const player = getState().players[playerId];
    const message = event.choices[choiceIndex].apply(player);
    EventBus.emit('notification', { message: `${event.icon} ${message}`, type: 'event' });
    pendingChoice = null;
}

export function hasPendingChoice() { return pendingChoice !== null; }
export function getPendingChoice() { return pendingChoice; }

function pickWeighted(events) {
    const total = events.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * total;
    for (const e of events) {
        roll -= e.weight;
        if (roll <= 0) return e;
    }
    return events[0];
}

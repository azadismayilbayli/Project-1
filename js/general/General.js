import { GENERAL_TRAITS, GENERAL_RANKS } from '../config.js';
import { getState, nextId } from '../core/GameState.js';

const GENERAL_NAMES = [
    'Alexander Volkov', 'Helena Stark', 'Marcus Aurelius', 'Victoria Cross',
    'Friedrich von Stein', 'Catherine Beaumont', 'Dmitri Orlov', 'Isabella Cortez',
    'Heinrich Mueller', 'Eleanor Blackwood', 'Konstantin Petrov', 'Margaret Sheffield',
    'Otto von Hammer', 'Natasha Romanova', 'William Ironside', 'Elizabeth Waverly',
    'Georgi Zhukov', 'Anne de Vries', 'James Thunder', 'Sofia Petrova',
    'Robert Steel', 'Maria Santos', 'Charles Wellington', 'Clara Eisenberg'
];

const BIOGRAPHIES = [
    'A brilliant tactician known for bold maneuvers.',
    'Rose through the ranks with exceptional strategic vision.',
    'Veteran of numerous campaigns, respected by all.',
    'Known for innovative approaches to warfare.',
    'A defensive genius who has never lost a fortified position.',
    'Aggressive commander who favors rapid strikes.',
    'Master of logistics and supply chain management.',
    'Expert in combined arms operations.'
];

let nameIdx = 0;

export function createGeneral(owner) {
    const state = getState();
    const traitKeys = Object.keys(GENERAL_TRAITS);
    const randomTrait = traitKeys[Math.floor(Math.random() * traitKeys.length)];

    const general = {
        id: nextId(),
        name: GENERAL_NAMES[nameIdx++ % GENERAL_NAMES.length],
        biography: BIOGRAPHIES[Math.floor(Math.random() * BIOGRAPHIES.length)],
        owner,
        rank: 0,
        leadership: 3 + Math.floor(Math.random() * 5),
        strategy: 3 + Math.floor(Math.random() * 5),
        logistics: 3 + Math.floor(Math.random() * 5),
        aggression: 3 + Math.floor(Math.random() * 5),
        politicalInfluence: 1 + Math.floor(Math.random() * 3),
        experience: 0,
        level: 1,
        traits: [randomTrait],
        assignedUnit: null,
        portraitIndex: Math.floor(Math.random() * 12)
    };

    state.generals.push(general);
    return general;
}

export function getGeneral(id) {
    return getState().generals.find(g => g.id === id);
}

export function getPlayerGenerals(playerId) {
    return getState().generals.filter(g => g.owner === playerId);
}

export function assignGeneral(generalId, unitId) {
    const state = getState();
    const general = state.generals.find(g => g.id === generalId);
    const unit = state.units.find(u => u.id === unitId);
    if (!general || !unit) return false;

    if (general.assignedUnit) {
        const oldUnit = state.units.find(u => u.id === general.assignedUnit);
        if (oldUnit) oldUnit.generalId = null;
    }

    general.assignedUnit = unitId;
    unit.generalId = generalId;
    return true;
}

export function checkPromotion(general) {
    const nextRank = general.rank + 1;
    if (nextRank >= GENERAL_RANKS.length) return false;
    if (general.experience >= GENERAL_RANKS[nextRank].xpRequired) {
        general.rank = nextRank;
        general.level++;
        general.leadership += 1;
        general.strategy += 1;

        const slots = GENERAL_RANKS[nextRank].traitSlots;
        if (general.traits.length < slots) {
            const available = Object.keys(GENERAL_TRAITS).filter(t => !general.traits.includes(t));
            if (available.length > 0) {
                general.traits.push(available[Math.floor(Math.random() * available.length)]);
            }
        }
        return true;
    }
    return false;
}

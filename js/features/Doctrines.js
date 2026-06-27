// National Doctrines - pick a unique playstyle bonus at game start.
// These define a nation's identity and create asymmetric, replayable strategies.

export const DOCTRINES = {
    bloodAndIron: {
        name: 'Blood & Iron',
        icon: '\u{2694}',
        tagline: 'War is the forge of nations.',
        description: '+25% unit attack. Captured cities keep 100% population. Generals gain XP 50% faster. But -20% science.',
        color: '#c62828',
        effects: { unitAttack: 0.25, captureRetention: 1.0, generalXP: 1.5, scienceMod: -0.2 }
    },
    enlightenment: {
        name: 'The Enlightenment',
        icon: '\u{1F4DC}',
        tagline: 'Knowledge is the truest power.',
        description: '+40% science. Techs cost 15% less. Free tech every 10 turns. But -15% unit defense.',
        color: '#1565c0',
        effects: { scienceMod: 0.4, techDiscount: 0.15, freeTechInterval: 10, unitDefense: -0.15 }
    },
    mercantile: {
        name: 'Mercantile Empire',
        icon: '\u{1F4B0}',
        tagline: 'Gold conquers what swords cannot.',
        description: '+50% gold. Trade agreements give +10 gold/turn each. Can buy production with gold. But cities grow 20% slower.',
        color: '#f9a825',
        effects: { goldMod: 0.5, tradeBonus: 10, rushBuy: true, growthMod: -0.2 }
    },
    fortressNation: {
        name: 'Fortress Nation',
        icon: '\u{1F6E1}',
        tagline: 'Let them break upon our walls.',
        description: '+50% city defense. Defensive buildings cost 40% less. Units heal fully in own territory. But -1 movement on offense.',
        color: '#455a64',
        effects: { cityDefense: 0.5, defBuildingDiscount: 0.4, homeHeal: true, offenseMovePenalty: 1 }
    },
    nomadicHorde: {
        name: 'Nomadic Horde',
        icon: '\u{1F40E}',
        tagline: 'The horizon is our home.',
        description: 'All units +2 movement. No supply penalties. Pillaging enemy tiles grants gold. But cities are -1 level effective.',
        color: '#6a1b9a',
        effects: { unitMovement: 2, ignoreSupply: true, pillageGold: true, cityLevelPenalty: 1 }
    },
    industrialMight: {
        name: 'Industrial Might',
        icon: '\u{1F3ED}',
        tagline: 'We will out-build the world.',
        description: '+45% production. Factories give double output. Build two things per city at once. But +30% pollution unrest.',
        color: '#5d4037',
        effects: { productionMod: 0.45, factoryBonus: 2.0, dualProduction: true, unrestMod: 0.3 }
    }
};

export function applyDoctrineToIncome(player, income) {
    const d = player.doctrine ? DOCTRINES[player.doctrine] : null;
    if (!d) return income;
    const e = d.effects;
    if (e.scienceMod) income.science = Math.floor(income.science * (1 + e.scienceMod));
    if (e.goldMod) income.gold = Math.floor(income.gold * (1 + e.goldMod));
    if (e.productionMod) income.production = Math.floor(income.production * (1 + e.productionMod));
    return income;
}

export function getDoctrineCombatMod(player, type) {
    const d = player.doctrine ? DOCTRINES[player.doctrine] : null;
    if (!d) return 0;
    const e = d.effects;
    if (type === 'attack' && e.unitAttack) return e.unitAttack;
    if (type === 'defense' && e.unitDefense) return e.unitDefense;
    if (type === 'cityDefense' && e.cityDefense) return e.cityDefense;
    return 0;
}

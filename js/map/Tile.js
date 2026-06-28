import { TERRAIN_BY_ID } from '../config.js';

export function createTile(q, r, terrainId) {
    return {
        q,
        r,
        terrain: TERRAIN_BY_ID[terrainId],
        owner: null,
        dataOwner: null,
        city: null,
        unit: null,
        improvement: null,
        resource: null,
        supply: 0,
        visible: false,
        explored: false
    };
}

import { HEX_SIZE } from './config.js';

const SQRT3 = Math.sqrt(3);

export function axialToPixel(q, r) {
    const x = HEX_SIZE * (SQRT3 * q + SQRT3 / 2 * r);
    const y = HEX_SIZE * (3 / 2 * r);
    return { x, y };
}

export function pixelToAxial(px, py) {
    const q = (SQRT3 / 3 * px - 1 / 3 * py) / HEX_SIZE;
    const r = (2 / 3 * py) / HEX_SIZE;
    return hexRound(q, r);
}

export function hexRound(q, r) {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);
    const dq = Math.abs(rq - q);
    const dr = Math.abs(rr - r);
    const ds = Math.abs(rs - s);
    if (dq > dr && dq > ds) rq = -rr - rs;
    else if (dr > ds) rr = -rq - rs;
    return { q: rq, r: rr };
}

export function hexDistance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function hexNeighbors(q, r) {
    return [
        { q: q + 1, r: r },     { q: q - 1, r: r },
        { q: q, r: r + 1 },     { q: q, r: r - 1 },
        { q: q + 1, r: r - 1 }, { q: q - 1, r: r + 1 }
    ];
}

export function hexKey(q, r) {
    return `${q},${r}`;
}

export function parseHexKey(key) {
    const [q, r] = key.split(',').map(Number);
    return { q, r };
}

export function hexRing(center, radius) {
    if (radius === 0) return [{ q: center.q, r: center.r }];
    const results = [];
    let hex = { q: center.q - radius, r: center.r + radius };
    const dirs = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    for (const dir of dirs) {
        for (let i = 0; i < radius; i++) {
            results.push({ q: hex.q, r: hex.r });
            hex = { q: hex.q + dir.q, r: hex.r + dir.r };
        }
    }
    return results;
}

export function hexSpiral(center, radius) {
    const results = [{ q: center.q, r: center.r }];
    for (let i = 1; i <= radius; i++) {
        results.push(...hexRing(center, i));
    }
    return results;
}

export function hexLineDraw(a, b) {
    const n = hexDistance(a, b);
    if (n === 0) return [{ q: a.q, r: a.r }];
    const results = [];
    for (let i = 0; i <= n; i++) {
        const t = i / n;
        const q = a.q + (b.q - a.q) * t;
        const r = a.r + (b.r - a.r) * t;
        results.push(hexRound(q, r));
    }
    return results;
}

export function getHexCorners(cx, cy) {
    const corners = [];
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 180 * (60 * i - 30);
        corners.push({
            x: cx + HEX_SIZE * Math.cos(angle),
            y: cy + HEX_SIZE * Math.sin(angle)
        });
    }
    return corners;
}

export function drawHex(ctx, cx, cy, fill, stroke) {
    const corners = getHexCorners(cx, cy);
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

export class PriorityQueue {
    constructor() { this.data = []; }
    push(item, priority) {
        this.data.push({ item, priority });
        this._bubbleUp(this.data.length - 1);
    }
    pop() {
        const top = this.data[0];
        const last = this.data.pop();
        if (this.data.length > 0) { this.data[0] = last; this._sinkDown(0); }
        return top?.item;
    }
    get size() { return this.data.length; }
    _bubbleUp(i) {
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.data[i].priority >= this.data[parent].priority) break;
            [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
            i = parent;
        }
    }
    _sinkDown(i) {
        const len = this.data.length;
        while (true) {
            let smallest = i;
            const l = 2 * i + 1, r = 2 * i + 2;
            if (l < len && this.data[l].priority < this.data[smallest].priority) smallest = l;
            if (r < len && this.data[r].priority < this.data[smallest].priority) smallest = r;
            if (smallest === i) break;
            [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
            i = smallest;
        }
    }
}

export function seededRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

export function smoothNoise(x, y, rand) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const n00 = rand(ix, iy), n10 = rand(ix + 1, iy);
    const n01 = rand(ix, iy + 1), n11 = rand(ix + 1, iy + 1);
    return lerp(lerp(n00, n10, sx), lerp(n01, n11, sx), sy);
}

export function generateNoise(width, height, seed, scale = 0.1) {
    const rng = seededRandom(seed);
    const perm = [];
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    const hash = (x, y) => {
        const xi = ((x % 256) + 256) % 256;
        const yi = ((y % 256) + 256) % 256;
        return perm[(perm[xi] + yi) % 256] / 255;
    };
    const result = [];
    for (let y = 0; y < height; y++) {
        result[y] = [];
        for (let x = 0; x < width; x++) {
            let val = 0, amp = 1, freq = scale, totalAmp = 0;
            for (let o = 0; o < 4; o++) {
                val += smoothNoise(x * freq, y * freq, hash) * amp;
                totalAmp += amp;
                amp *= 0.5;
                freq *= 2;
            }
            result[y][x] = val / totalAmp;
        }
    }
    return result;
}

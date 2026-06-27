// Lightweight particle & floating-text animation system layered over the map.
// Gives combat, captures, and events satisfying visual punch.

import { axialToPixel } from '../utils.js';
import { EventBus } from '../events.js';

let particles = [];
let floatingTexts = [];
let shockwaves = [];

export function initAnimations() {
    EventBus.on('combat:resolved', (result) => {
        const dq = result.defender.q, dr = result.defender.r;
        const { x, y } = axialToPixel(dq, dr);
        spawnExplosion(x, y, result.isCrit);
        spawnFloatingText(x, y, `-${result.damageToDefender}`, result.isCrit ? '#ffd700' : '#ff5252');
        if (result.isCrit) spawnFloatingText(x, y - 20, 'CRITICAL!', '#ffd700', 28);
        if (result.defenderKilled) {
            spawnShockwave(x, y, '#ff5252');
            spawnFloatingText(x, y + 20, 'DESTROYED', '#ff5252', 16);
        }
        if (result.damageToAttacker > 0) {
            const ap = axialToPixel(result.attacker.q, result.attacker.r);
            spawnFloatingText(ap.x, ap.y, `-${result.damageToAttacker}`, '#ff9800');
        }
    });

    EventBus.on('combat:resolved', (result) => {
        if (result.cityCaptured) {
            const { x, y } = axialToPixel(result.cityCaptured.q, result.cityCaptured.r);
            spawnShockwave(x, y, '#ffd700');
            spawnFloatingText(x, y - 30, 'CITY CAPTURED!', '#ffd700', 22);
            for (let i = 0; i < 20; i++) spawnConfetti(x, y);
        }
    });

    EventBus.on('unit:moved', () => {});

    EventBus.on('wonder:completed', (data) => {
        EventBus.emit('notification', { message: `\u{1F3DB} A WONDER IS COMPLETE! ${data.cityName} unveils its masterpiece.`, type: 'event' });
    });
}

function spawnExplosion(x, y, big) {
    const count = big ? 24 : 14;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = (big ? 4 : 2.5) + Math.random() * 2;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1, decay: 0.025 + Math.random() * 0.02,
            size: (big ? 5 : 3) + Math.random() * 3,
            color: big ? ['#ffd700', '#ff9800', '#ff5252'][i % 3] : ['#ff9800', '#ff5252', '#ffeb3b'][i % 3]
        });
    }
}

function spawnConfetti(x, y) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.12,
        life: 1, decay: 0.012,
        size: 3 + Math.random() * 3,
        color: ['#ffd700', '#4fc3f7', '#81c784', '#ff8a65', '#ba68c8'][Math.floor(Math.random() * 5)]
    });
}

function spawnShockwave(x, y, color) {
    shockwaves.push({ x, y, radius: 5, maxRadius: 50, life: 1, color });
}

function spawnFloatingText(x, y, text, color, size = 18) {
    floatingTexts.push({ x, y, text, color, size, life: 1, vy: -1 });
}

export function updateAndRenderAnimations(ctx, camera) {
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const s = shockwaves[i];
        s.radius += (s.maxRadius - s.radius) * 0.15;
        s.life -= 0.04;
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.stroke();
        if (s.life <= 0) shockwaves.splice(i, 1);
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.gravity) p.vy += p.gravity;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= p.decay;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Floating text
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px "Orbitron", sans-serif';
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y += t.vy;
        t.vy *= 0.97;
        t.life -= 0.018;
        ctx.globalAlpha = Math.max(0, t.life);
        ctx.font = `bold ${t.size}px "Orbitron", sans-serif`;
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
        if (t.life <= 0) floatingTexts.splice(i, 1);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
}

export function hasActiveAnimations() {
    return particles.length > 0 || floatingTexts.length > 0 || shockwaves.length > 0;
}

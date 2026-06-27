import { clamp } from '../utils.js';

export class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.minZoom = 0.3;
        this.maxZoom = 2.5;
        this.targetX = 0;
        this.targetY = 0;
        this.targetZoom = 1;
        this.smoothing = 0.15;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.lastX = 0;
        this.lastY = 0;
    }

    screenToWorld(sx, sy) {
        return {
            x: (sx - this.canvas.width / 2) / this.zoom + this.x,
            y: (sy - this.canvas.height / 2) / this.zoom + this.y
        };
    }

    worldToScreen(wx, wy) {
        return {
            x: (wx - this.x) * this.zoom + this.canvas.width / 2,
            y: (wy - this.y) * this.zoom + this.canvas.height / 2
        };
    }

    pan(dx, dy) {
        this.targetX += dx / this.zoom;
        this.targetY += dy / this.zoom;
    }

    zoomAt(delta, sx, sy) {
        const factor = delta > 0 ? 0.9 : 1.1;
        this.targetZoom = clamp(this.targetZoom * factor, this.minZoom, this.maxZoom);
    }

    centerOn(wx, wy) {
        this.targetX = wx;
        this.targetY = wy;
    }

    update() {
        this.x += (this.targetX - this.x) * this.smoothing;
        this.y += (this.targetY - this.y) * this.smoothing;
        this.zoom += (this.targetZoom - this.zoom) * this.smoothing;
    }

    getViewport() {
        const halfW = this.canvas.width / 2 / this.zoom;
        const halfH = this.canvas.height / 2 / this.zoom;
        return {
            left: this.x - halfW - 100,
            right: this.x + halfW + 100,
            top: this.y - halfH - 100,
            bottom: this.y + halfH + 100
        };
    }
}

// FlipbookSprite3D.mjs
// Simple flip-book helper: draws a grid-based sprite sheet on a THREE.Sprite
// Author: Konnie

import { RepeatWrapping, Sprite, SpriteMaterial } from 'three-161';

export default class FlipbookSprite3D {
    /**
     * @param {Object} options
     * @param {String}  options.sheetKey             – key of the atlas in app.assets.images
     * @param {Number}  options.tilesX               – columns in the grid
     * @param {Number}  options.tilesY               – rows in the grid
     * @param {Number}  options.totalFrames          – how many frames to cycle through
     * @param {Number}  [options.fps = 40]           – playback speed
     * @param {Boolean} [options.depthWrite = false] – render behind other objects
     * @param {Number}  [options.renderOrder = 1]    – render order
     */
    constructor(options) {
        let map = app.three.getMap(options.sheetKey, true);
        map.wrapS = map.wrapT = RepeatWrapping;
        map.repeat.set(1 / options.tilesX, 1 / options.tilesY);
        map.needsUpdate = true;

        this.material = new SpriteMaterial({ map, transparent: true });
        this.sprite = new Sprite(this.material);

        let tileWidth = map.image.width / options.tilesX;
        let tileHeight = map.image.height / options.tilesY;
        this.sprite.scale.set(tileWidth, tileHeight);

        this.tilesX = options.tilesX;
        this.tilesY = options.tilesY;
        this.total = options.totalFrames;
        this.fps = options.fps ?? 40;

        this.material.depthWrite = options.depthWrite ?? false;
        this.sprite.renderOrder = options.renderOrder ?? 1;

        this.accumulator = 0;
        this.frameIndex = 0;

        this.play(); // start immediately

        app.loop.add(this.update);
    }

    /** Main tick. dtMs comes from GameLoopManager in milliseconds. */

    update = (dtMs) => {
        if (!this.isPlaying) return;

        this.accumulator += dtMs;
        const frameTime = 1000 / this.fps;

        while (this.accumulator >= frameTime) {
            this.frameIndex = (this.frameIndex + 1) % this.total;
            this.applyFrameUV();
            this.accumulator -= frameTime;
        }
    };

    play() { this.isPlaying = true; }
    stop() { this.isPlaying = false; }

    gotoAndPlay(frame = 0) {
        this.frameIndex = frame % this.total;
        this.applyFrameUV();
        this.play();
    }

    gotoAndStop(frame = 0) {
        this.frameIndex = frame % this.total;
        this.applyFrameUV();
        this.stop();
    }

    playOnce(startFrame = 0, onComplete) {
        if (this.onceTween) { this.onceTween.kill(); this.onceTween = null; }

        this.gotoAndPlay(startFrame);

        let totalSeconds = this.total / this.fps;

        this.onceTween = gsap.delayedCall(totalSeconds, () => {
            this.gotoAndStop(this.total - 1);
            if (typeof onComplete === 'function') { onComplete(); }
            this.onceTween = null;
        });
    }

    show() { this.sprite.visible = true; }
    hide() { this.sprite.visible = false; }

    destroy() {
        app.loop.remove(this.update);
        this.sprite.removeFromParent();
        this.material.map.dispose();
        this.material.dispose();
    }

    // Apply UV offset for current frame
    applyFrameUV() {
        let col = this.frameIndex % this.tilesX;
        let row = Math.floor(this.frameIndex / this.tilesX);
        this.material.map.offset.set(
            col / this.tilesX,
            1 - (row + 1) / this.tilesY
        );
    }
}


// alternative update loop

// update = (dtMs) => {
//     if (!this.isPlaying) { return; }

//     let dt = dtMs * 0.001;
//     this.accumulator += dt;

//     let framesToAdvance = Math.floor(this.accumulator * this.fps);
//     if (framesToAdvance > 0) {
//         this.frameIndex = (this.frameIndex + framesToAdvance) % this.total;
//         this.accumulator -= framesToAdvance / this.fps;
//         this.applyFrameUV();
//     }
// };
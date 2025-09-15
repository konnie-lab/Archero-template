// effects/GhostTrail.mjs


export class GhostTrail {
    static pools = new Map(); // textureKey -> Sprite[]

    static getFromPool(textureKey) {
        let pool = GhostTrail.pools.get(textureKey);
        if (!pool) {
            pool = [];
            GhostTrail.pools.set(textureKey, pool);
        }
        let ghostSprite = pool.pop();
        if (!ghostSprite) {
            ghostSprite = app.three.sprite(textureKey, { scale: 0.02 });
            ghostSprite.material.depthTest = false;
            ghostSprite.material.depthWrite = false;
            ghostSprite.material.transparent = true;
            ghostSprite.renderOrder = 10;
        }
        ghostSprite.visible = true;
        return ghostSprite;
    }

    static returnToPool(textureKey, ghostSprite) {
        if (!ghostSprite) return;
        ghostSprite.visible = false;
        if (ghostSprite.parent) ghostSprite.removeFromParent();
        let pool = GhostTrail.pools.get(textureKey);
        if (pool) pool.push(ghostSprite);
    }

    constructor(root, options = {}) {
        this.root = root;

        this.textureKey       = options.textureKey  ?? 'arrow_hero';
        this.intervalSeconds  = options.interval    ?? 0.02;
        this.lifetimeSeconds  = options.life        ?? 0.30;
        this.startingOpacity  = options.startAlpha  ?? 0.6;
        this.scaleMultiplier  = options.scaleMul    ?? 0.85;
        this.shrinkFactor     = options.shrinkEach  ?? 0.985;
        this.easing           = options.easing      ?? 'linear';

        this.timerSeconds     = 0;
        this.enabled          = true;
    }

    updateFrom(sourceSprite, deltaSeconds = 1 / 40) {
        if (!this.enabled || !sourceSprite || !this.root) return;

        this.timerSeconds += deltaSeconds;
        if (this.timerSeconds < this.intervalSeconds) return;
        this.timerSeconds = 0;

        let ghostSprite = GhostTrail.getFromPool(this.textureKey);
        ghostSprite.position.copy(sourceSprite.position);

        if (ghostSprite.material) {
            ghostSprite.material.rotation = sourceSprite.material?.rotation || 0;
            ghostSprite.material.opacity  = this.startingOpacity;
        }
        ghostSprite.rotation.z = sourceSprite.rotation?.z || 0;

        ghostSprite.scale.copy(sourceSprite.scale).multiplyScalar(this.scaleMultiplier);
        this.root.add(ghostSprite);

        gsap.to(ghostSprite.material, {
            opacity: 0,
            duration: this.lifetimeSeconds,
            ease: this.easing,
            onUpdate: () => {
                if (this.shrinkFactor !== 1) ghostSprite.scale.multiplyScalar(this.shrinkFactor);
            },
            onComplete: () => GhostTrail.returnToPool(this.textureKey, ghostSprite)
        });
    }

    destroy() { this.enabled = false; }
}

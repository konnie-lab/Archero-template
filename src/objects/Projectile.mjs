// objects/Projectile.mjs
import { Vector3 } from 'three-161';
import { GhostTrail } from '../fx/GhostTrail.mjs';

export default class Projectile {
    parent;          // Group OR { worldRoot: Group }
    root;            // resolved Group
    sprite;          // THREE.Sprite via app.three.sprite()

    speed = 32;      // units/sec
    hitRadius = 0.6;
    damage = 0;

    targetEnemy = null;
    maxLifetimeSeconds = 1.5;
    timeAliveSeconds = 0;

    trail = null;    // GhostTrail | null

    constructor(parent, startPosition, targetEnemy, damage, options = {}) {
        this.parent = parent;
        this.root = (parent && parent.worldRoot) ? parent.worldRoot : parent;
        this.targetEnemy = targetEnemy || null;
        this.damage = damage | 0;

        if (!this.root) throw new Error('Projectile: parent must be worldRoot or contain worldRoot');

        let textureKey = options.textureKey || 'arrow_hero';
        if (options.speed) this.speed = options.speed;
        if (options.hitRadius) this.hitRadius = options.hitRadius;

        this.sprite = app.three.sprite(textureKey, { scale: 0.02 });
        this.sprite.name = 'HeroProjectile';
        this.sprite.position.copy(startPosition);

        this.sprite.material.depthTest = false;
        this.sprite.material.depthWrite = false;
        this.sprite.material.transparent = true;
        this.sprite.renderOrder = 10;

        this.root.add(this.sprite);

        if (this.targetEnemy?.model) {
            let targetPosition = this.targetEnemy.model.position;
            let dx = targetPosition.x - startPosition.x;
            let dy = targetPosition.y - startPosition.y;
            let dz = targetPosition.z - startPosition.z;
            let initialDistance = Math.hypot(dx, dy, dz);
            this.maxLifetimeSeconds = Math.min(3.5, Math.max(0.6, initialDistance / this.speed + 0.5));
        }

        this.updateRotationToTarget(); // once

        let wantsTrail = options.trail !== false;
        if (wantsTrail) {
            let trailTextureKey = options.trailTextureKey || textureKey;
            this.trail = new GhostTrail(this.root, {
                textureKey: trailTextureKey,
                interval: options.trailInterval ?? 0.02,
                life: options.trailLife ?? 0.30,
                startAlpha: options.trailAlpha ?? 0.6,
                scaleMul: options.trailScaleMul ?? 0.85,
                shrinkEach: options.trailShrink ?? 0.985,
                easing: options.trailEasing ?? 'linear',
            });
        }

        app.loop.add(this.onUpdate);
    }

    onUpdate = () => {
        let deltaSeconds = 1 / 40;
        this.timeAliveSeconds += deltaSeconds;

        if (!this.targetEnemy || !this.targetEnemy.model || this.timeAliveSeconds >= this.maxLifetimeSeconds) {
            this.destroy();
            return;
        }

        let currentPosition = this.sprite.position;
        let targetPosition = this.targetEnemy.model.position;

        let direction = new Vector3(
            targetPosition.x - currentPosition.x,
            targetPosition.y - currentPosition.y,
            targetPosition.z - currentPosition.z
        );
        let distance = direction.length();
        if (distance > 0.0001) direction.multiplyScalar(1 / distance);

        let step = this.speed * deltaSeconds;
        this.sprite.position.x += direction.x * step;
        this.sprite.position.y += direction.y * step;
        this.sprite.position.z += direction.z * step;

        if (this.trail) this.trail.updateFrom(this.sprite, deltaSeconds);

        if (distance <= Math.max(this.hitRadius, step)) {
            if (!this.targetEnemy.isDead) {
                this.targetEnemy.applyDamage(this.damage);

                app.eventEmitter.emit(app.data.EVENTS.SHOW_DAMAGE_NUMBER, {
                    worldObject: this.targetEnemy.model, 
                    amount: this.damage | 0,
                    color: 0xff3b30,                      
                    yOffset: 2.0                          
                });

                app.eventEmitter.emit(app.data.EVENTS.PROJECTILE_HIT, {
                    target: this.targetEnemy,
                    amount: this.damage
                });
            }
            this.destroy();
        }
    };

    updateRotationToTarget() {
        if (!this.targetEnemy?.model) return;
        let camera = app.three.camera;
        if (!camera) return;

        let projectedStart = this.sprite.position.clone().project(camera);
        let projectedTarget = this.targetEnemy.model.position.clone().project(camera);

        let dx = projectedTarget.x - projectedStart.x;
        let dy = projectedTarget.y - projectedStart.y;

        let angle = -Math.atan2(dx, dy); 
        if (this.sprite.material) this.sprite.material.rotation = angle;
        this.sprite.rotation.z = angle;
    }

    destroy() {
        app.loop.remove(this.onUpdate);
        if (this.sprite?.parent) this.sprite.removeFromParent();

        if (this.trail) this.trail.destroy();
        this.trail = null;

        this.sprite = null;
        this.targetEnemy = null;
        this.root = null;
        this.parent = null;
    }
}

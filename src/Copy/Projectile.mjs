// objects/Projectile.mjs
import { Vector3 } from 'three-161';
import { GhostTrail } from '../fx/GhostTrail.mjs';
import { CircleShape, VerletBody } from '../modules/physics/VerletPhysics.mjs';

export default class Projectile {
    parent;
    root;
    sprite;

    speed = 32;
    hitRadius = 0.6;
    damage = 0;

    targetEnemy = null;
    fixedDirection = null;      // straight flight if provided

    maxLifetimeSeconds = 1.5;
    timeAliveSeconds = 0;

    trail = null;    // GhostTrail | null

    // optional effects
    onHitEffects = null;        // { burn:{tickDamage,ticks,intervalSec} }
    ricochet = null;            // { enabled, chainMaxTargets, chainRadius, hitSet, hitCount }

    constructor(parent, startPosition, targetEnemy, damage, options = {}) {
        this.parent = parent;
        this.root = (parent && parent.worldRoot) ? parent.worldRoot : parent;
        this.targetEnemy = targetEnemy || null;
        this.damage = damage | 0;

        if (!this.root) throw new Error('Projectile: parent must be worldRoot or contain worldRoot');

        let textureKey = options.textureKey || 'arrow_hero';
        if (options.speed) this.speed = options.speed;
        if (options.hitRadius) this.hitRadius = options.hitRadius;

        // straight flight direction (for multishot side arrows)
        if (options.fixedDirection) {
            let direction = options.fixedDirection;
            let straight = new Vector3(direction.x || 0, direction.y || 0, direction.z || 0);
            if (straight.lengthSq() > 1e-8) straight.normalize(); else straight.set(0, 0, 1);
            this.fixedDirection = straight;
            this.maxLifetimeSeconds = 2.0; // tune for side-arrows;
        }

        // effects payloads
        if (options.onHitEffects) this.onHitEffects = options.onHitEffects;

        if (options.ricochet?.enabled) {
            let maxTargets = Math.max(1, options.ricochet.chainMaxTargets || 3);
            let radius = options.ricochet.chainRadius || 6.0;
            this.ricochet = {
                enabled: true,
                chainMaxTargets: maxTargets,
                chainRadius: radius,
                hitSet: new Set(),
                hitCount: 0
            };
        }

        this.sprite = app.three.sprite(textureKey, { scale: 0.02 });
        this.sprite.name = 'HeroProjectile';
        this.sprite.position.copy(startPosition);

        this.sprite.material.depthTest = false;
        this.sprite.material.depthWrite = false;
        this.sprite.material.transparent = true;
        this.sprite.renderOrder = 10;

        this.root.add(this.sprite);

        if (options.dieOnWall) {
            let shape = new CircleShape(this.hitRadius);
            this.body = app.phys.addModel(this.sprite, shape, false, true);
            this.body.on(VerletBody.EVENT_COLLIDE, this.onCollideSensor);
        }

        if (!this.fixedDirection && this.targetEnemy?.model) {
            let targetPosition = this.targetEnemy.model.position;
            let dx = targetPosition.x - startPosition.x;
            let dy = targetPosition.y - startPosition.y;
            let dz = targetPosition.z - startPosition.z;
            let initialDistance = Math.hypot(dx, dy, dz);
            this.maxLifetimeSeconds = Math.min(3.5, Math.max(0.6, initialDistance / this.speed + 0.5));
        }

        this.updateRotationToTargetOrDirection(); // once

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

    onCollideSensor = (otherBody) => {
        if (otherBody?.isWall) {
            this.destroy();
        }
    };

    onUpdate = () => {
        let deltaSeconds = 1 / 40;
        this.timeAliveSeconds += deltaSeconds;

        // lifetime guard
        if (this.timeAliveSeconds >= this.maxLifetimeSeconds) {
            this.destroy();
            return;
        }

        // position integrate
        if (this.fixedDirection) {
            this.moveStraight(deltaSeconds);
        } else if (this.targetEnemy && this.targetEnemy.model) {
            this.moveHoming(deltaSeconds);
        } else {
            this.destroy();
            return;
        }

        if (this.trail) this.trail.updateFrom(this.sprite, deltaSeconds);

        // collision check vs current target OR any enemy in radius for straight flight
        if (this.fixedDirection) {
            let hitEnemy = this.findFirstEnemyInRadius();
            if (hitEnemy) this.onHitEnemy(hitEnemy);
        } else {
            let targetPosition = this.targetEnemy?.model?.position;
            if (!targetPosition) return;
            let distance = this.distanceTo(targetPosition);
            let step = this.speed * deltaSeconds;
            if (distance <= Math.max(this.hitRadius, step)) {
                this.onHitEnemy(this.targetEnemy);
            }
        }
    };

    moveStraight(deltaSeconds) {
        let step = this.speed * deltaSeconds;
        this.sprite.position.x += this.fixedDirection.x * step;
        this.sprite.position.y += this.fixedDirection.y * step;
        this.sprite.position.z += this.fixedDirection.z * step;
        this.updateRotationToDirection(this.fixedDirection);
    }

    moveHoming(deltaSeconds) {
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

        this.updateRotationToDirection(direction);
    }

    findFirstEnemyInRadius() {
        if (!this.root) return null;
        let bestEnemy = null;

        for (let child of this.root.children) {
            if (child?.name !== 'Enemy') continue;
            let enemy = child.userData?.enemy;
            if (!enemy || enemy.isDead) continue;

            let distance = this.distanceTo(child.position);
            if (distance <= this.hitRadius) {
                bestEnemy = enemy;
                break;
            }
        }
        return bestEnemy;
    }

    distanceTo(targetVec3) {
        let dx = targetVec3.x - this.sprite.position.x;
        let dy = targetVec3.y - this.sprite.position.y;
        let dz = targetVec3.z - this.sprite.position.z;
        return Math.hypot(dx, dy, dz);
    }

    onHitEnemy(enemyInstance) {
        if (enemyInstance.isDead) { this.destroy(); return; }

        enemyInstance.applyDamage(this.damage);

        app.eventEmitter.emit(app.data.EVENTS.SHOW_DAMAGE_NUMBER, {
            worldObject: enemyInstance.model,
            amount: this.damage | 0,
            color: 0xff3b30,
            yOffset: 2.0
        });

        // apply onHit effects (burn)
        if (this.onHitEffects?.burn) {
            let burnInfo = this.onHitEffects.burn;
            let tickDamage = Math.max(1, burnInfo.tickDamage | 0);
            let ticks = Math.max(1, burnInfo.ticks | 0);
            let intervalSec = Math.max(0.05, burnInfo.intervalSec || 1.0);
            if (enemyInstance?.addBurnDot) {
                enemyInstance.addBurnDot(tickDamage, ticks, intervalSec);
            }
        }

        // ricochet chain
        if (this.ricochet?.enabled) {
            if (enemyInstance) this.ricochet.hitSet.add(enemyInstance);
            this.ricochet.hitCount += 1;

            if (this.ricochet.hitCount < this.ricochet.chainMaxTargets) {
                let nextEnemy = this.findNextRicochetTarget(enemyInstance);
                if (nextEnemy) {
                    this.targetEnemy = nextEnemy;
                    // give it a small extra lifetime budget so chain have time to fly
                    this.timeAliveSeconds = Math.max(0, this.timeAliveSeconds - 0.2);
                    this.maxLifetimeSeconds = Math.min(3.5, this.maxLifetimeSeconds + 0.8);
                    this.updateRotationToTargetOrDirection();
                    return; // do not destroy
                }
            }
        }
        // default: destroy on hit
        this.destroy();
    }

    findNextRicochetTarget(fromEnemy) {
        if (!this.root) return null;

        let searchRadius = this.ricochet.chainRadius || 6.0;
        let bestEnemy = null;
        let bestDistSq = searchRadius * searchRadius;

        let fromPos = fromEnemy?.model?.position;
        if (!fromPos) return null;

        for (let child of this.root.children) {
            if (child?.name !== 'Enemy') continue;
            let enemy = child.userData?.enemy;
            if (!enemy || enemy.isDead) continue;
            if (this.ricochet.hitSet.has(enemy)) continue;

            let dx = child.position.x - fromPos.x;
            let dz = child.position.z - fromPos.z;
            let distSq = dx * dx + dz * dz;

            if (distSq <= bestDistSq) {
                bestDistSq = distSq;
                bestEnemy = enemy;
            }
        }
        return bestEnemy;
    }

    updateRotationToTargetOrDirection() {
        if (this.fixedDirection) {
            this.updateRotationToDirection(this.fixedDirection);
            return;
        }
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

    updateRotationToDirection(directionVec3) {
        let camera = app.three.camera;
        if (!camera || !directionVec3) return;

        let tmpFrom = this.sprite.position.clone().project(camera);
        let tmpTo = this.sprite.position.clone().addScaledVector(directionVec3, 0.01).project(camera);

        let dx = tmpTo.x - tmpFrom.x;
        let dy = tmpTo.y - tmpFrom.y;
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
        this.fixedDirection = null;
        this.onHitEffects = null;
        this.ricochet = null;
    }


}

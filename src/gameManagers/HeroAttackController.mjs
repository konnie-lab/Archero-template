// gameManagers/HeroAttackController.mjs
import { Vector3 } from 'three-161';
import Projectile from '../objects/Projectile.mjs';

let ATTACK_PRESETS = {
    // --- base preset ---
    basic: {
        cooldown: 0.75,
        damageMul: 1.0,
        projectile: { textureKey: 'arrow_hero', speed: 32, hitRadius: 0.3 },
        trail: { enabled: false, life: 0.30, interval: 0.02 }
    },

    multishot: {
        // +10% damage, 3 arrows: center = homing, two side = straight ±30°
        cooldown: 0.75,
        damageMul: 1.10,
        projectile: { textureKey: 'arrow_hero', speed: 32, hitRadius: 0.3 },
        trail: { enabled: true, life: 0.30, interval: 0.02 },
        meta: { type: 'multishot', sideAngleDeg: 15 }
    },

    fire: {
        // +150% damage, burn DoT: 5 ticks, 1/sec; tickDamage = 20% of base damage
        cooldown: 0.75,
        damageMul: 1.50,
        projectile: { textureKey: 'arrow_fire', speed: 32, hitRadius: 0.6 },
        trail: { enabled: true, life: 0.35, interval: 0.018 },
        meta: { type: 'burn', burn: { ticks: 5, intervalSec: 1.0, tickDamageMulOfBase: 0.20 } }
    },

    ricochet: {
        // hits up to 3 targets (including the first one), ricochets without losing damage
        cooldown: 0.75,
        damageMul: 1.00,
        projectile: { textureKey: 'arrow_hero', speed: 32, hitRadius: 0.6 },
        trail: { enabled: true, life: 0.30, interval: 0.02 },
        meta: { type: 'ricochet', chainMaxTargets: 3, chainRadius: 12.0 }
    },
};

export default class HeroAttackController {
    hero;
    worldRoot;

    attackCooldown = 0.75;
    timer = 0;

    range = 30.0;
    enabled = true;

    // pause after hero stops moving («load arrow animation»)
    settleDelaySeconds = 0.05;
    settleTimer = 0;
    wasMoving = false;

    enemyTrack = new Map();

    attackTypeKey = 'basic';

    constructor(hero, worldRoot) {
        this.hero = hero;
        this.worldRoot = worldRoot;
        app.loop.add(this.onUpdate);

        this.initEvents();
    }

    initEvents() {
        app.eventEmitter.on(app.data.EVENTS.GAMEPLAY_PAUSE, () => this.enabled = false);
        app.eventEmitter.on(app.data.EVENTS.GAMEPLAY_RESUME, () => this.enabled = true);
    }

    setAttackKey(key) {
        this.attackTypeKey = ATTACK_PRESETS[key] ? key : 'basic';
    }

    getAttackPreset() {
        return ATTACK_PRESETS[this.attackTypeKey] || ATTACK_PRESETS.basic;
    }

    onUpdate = () => {
        if (!this.enabled || !this.hero?.model) return;

        this.updateEnemyVelocities();

        let deltaSeconds = 1 / 40;
        let isMoving = this.hero.speed > 0;

        if (isMoving) {
            this.wasMoving = true;
            this.settleTimer = this.settleDelaySeconds;
            return;
        } else if (this.wasMoving) {
            this.wasMoving = false;
            if (this.settleTimer <= 0) this.settleTimer = this.settleDelaySeconds;
        }

        if (this.settleTimer > 0) {
            this.settleTimer -= deltaSeconds;
            return;
        }

        this.timer -= deltaSeconds;
        if (this.timer > 0) return;

        let targetEnemy = this.findNearestEnemyInRange();
        if (!targetEnemy) return;

        this.fireAt(targetEnemy);
    };

    updateEnemyVelocities() {
        if (!this.worldRoot) return;

        let deltaSeconds = 1 / 40;
        for (let child of this.worldRoot.children) {
            if (child?.name !== 'Enemy') continue;

            let enemyInstance = child.userData?.enemy;
            if (!enemyInstance || enemyInstance.isDead) continue;

            let enemyPosition = child.position;
            let record = this.enemyTrack.get(enemyInstance);

            if (record) {
                let vx = (enemyPosition.x - record.x) / deltaSeconds;
                let vz = (enemyPosition.z - record.z) / deltaSeconds;
                this.enemyTrack.set(enemyInstance, { x: enemyPosition.x, z: enemyPosition.z, vx, vz });
            } else {
                this.enemyTrack.set(enemyInstance, { x: enemyPosition.x, z: enemyPosition.z, vx: 0, vz: 0 });
            }
        }
    }

    findNearestEnemyInRange() {
        if (!this.worldRoot) return null;

        let heroPosition = this.hero.model.position;
        let nearestEnemy = null;
        let bestDistanceSquared = this.range * this.range;

        for (let child of this.worldRoot.children) {
            if (child?.name !== 'Enemy') continue;

            let enemyInstance = child.userData?.enemy;
            if (!enemyInstance || enemyInstance.isDead) continue;

            let dx = child.position.x - heroPosition.x;
            let dz = child.position.z - heroPosition.z;
            let distanceSquared = dx * dx + dz * dz;

            if (distanceSquared <= bestDistanceSquared) {
                bestDistanceSquared = distanceSquared;
                nearestEnemy = enemyInstance;
            }
        }
        return nearestEnemy;
    }


    fireAt(targetEnemy) {
        let startPosition = this.hero.model.position.clone();
        startPosition.y += 1.4;

        let baseDamage = app.data.GAME_CONFIG.hero.dmg | 0;
        let preset = this.getAttackPreset();
        let finalDamage = Math.round(baseDamage * (preset.damageMul || 1.0));

        let projectilePreset = preset.projectile || {};
        let trailPreset = preset.trail || {};

        let projectileOptions = { textureKey: projectilePreset.textureKey || 'arrow_hero' };
        if (projectilePreset.speed) projectileOptions.speed = projectilePreset.speed;
        if (projectilePreset.hitRadius) projectileOptions.hitRadius = projectilePreset.hitRadius;

        if (trailPreset.enabled === false) {
            projectileOptions.trail = false;
        } else {
            if (trailPreset.life != null) projectileOptions.trailLife = trailPreset.life;
            if (trailPreset.interval != null) projectileOptions.trailInterval = trailPreset.interval;
            if (trailPreset.textureKey) projectileOptions.trailTextureKey = trailPreset.textureKey;
            if (trailPreset.alpha != null) projectileOptions.trailAlpha = trailPreset.alpha;
        }

        let meta = preset.meta || {};

        // MULTISHOT: 1 homing + 2 straight based on the central shot direction
        if (meta.type === 'multishot') {
            // 0) central homing
            new Projectile(this.worldRoot, startPosition, targetEnemy, finalDamage, { ...projectileOptions });

            // 1) compute base direction from start → target (XZ)
            let baseDir = new Vector3(0, 0, 1);
            if (targetEnemy?.model) {
                baseDir.set(
                    targetEnemy.model.position.x - startPosition.x,
                    0,
                    targetEnemy.model.position.z - startPosition.z
                );
                if (baseDir.lengthSq() > 1e-8) baseDir.normalize();
            } else {
                // fallback to hero facing
                let yaw = this.hero.model.rotation.y;
                baseDir.set(Math.sin(yaw), 0, Math.cos(yaw));
            }

            // 2) angle from config → preset → default
            let angleDeg = app.data.GAME_CONFIG?.multishotAngleDeg != null
                ? app.data.GAME_CONFIG.multishotAngleDeg
                : (meta.sideAngleDeg != null ? meta.sideAngleDeg : 30);
            let angleRad = angleDeg * Math.PI / 180;

            let left = rotateDirXZ(baseDir.x, baseDir.z, +angleRad);
            let right = rotateDirXZ(baseDir.x, baseDir.z, -angleRad);

            // 3) two straight arrows, die on walls
            new Projectile(this.worldRoot, startPosition, null, finalDamage, {
                ...projectileOptions,
                fixedDirection: { x: left.x, y: 0, z: left.z },
                dieOnWall: true
            });
            new Projectile(this.worldRoot, startPosition, null, finalDamage, {
                ...projectileOptions,
                fixedDirection: { x: right.x, y: 0, z: right.z },
                dieOnWall: true
            });
        }
        // FIRE: apply burn on hit
        else if (meta.type === 'burn') {
            let burnTickDamage = Math.round((meta.burn?.tickDamageMulOfBase || 0.2) * baseDamage);
            let burnTicks = Math.max(1, meta.burn?.ticks || 5);
            let burnIntervalSec = meta.burn?.intervalSec || 1.0;

            new Projectile(this.worldRoot, startPosition, targetEnemy, finalDamage, {
                ...projectileOptions,
                onHitEffects: {
                    burn: { tickDamage: burnTickDamage, ticks: burnTicks, intervalSec: burnIntervalSec }
                }
            });
        }
        // RICOCHET: chain
        else if (meta.type === 'ricochet') {
            new Projectile(this.worldRoot, startPosition, targetEnemy, finalDamage, {
                ...projectileOptions,
                ricochet: {
                    enabled: true,
                    chainMaxTargets: Math.max(1, meta.chainMaxTargets || 3),
                    chainRadius: meta.chainRadius || 12.0
                }
            });
        }
        // default
        else {
            new Projectile(this.worldRoot, startPosition, targetEnemy, finalDamage, { ...projectileOptions });
        }

        let cooldownSeconds = (preset.cooldown ?? 0.75);
        this.timer = cooldownSeconds;
    }

    destroy() { app.loop.remove(this.onUpdate); }
}

// --- helpers ---
function rotateDirXZ(x, z, angleRad) {
    // rotate vector (x,z) by angle around Y
    let cosA = Math.cos(angleRad);
    let sinA = Math.sin(angleRad);
    let nx = x * cosA - z * sinA;
    let nz = x * sinA + z * cosA;
    return { x: nx, z: nz };
}



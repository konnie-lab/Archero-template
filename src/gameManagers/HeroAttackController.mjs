// gameManagers/HeroAttackController.mjs
import Projectile from '../objects/Projectile.mjs';

let ATTACK_PRESETS = {
    basic: {
        cooldown: 0.1,
        damageMul: 1.0,
        projectile: { textureKey: 'arrow_hero', speed: 32, hitRadius: 0.6 },
        trail: { enabled: true, life: 0.30, interval: 0.02 }
    },
    fire: {
        cooldown: 0.75,
        damageMul: 1.15, // +15%
        projectile: { textureKey: 'arrow_fire', speed: 32, hitRadius: 0.6 },
        trail: { enabled: true, life: 0.35, interval: 0.018 }
    },
    ice: {
        cooldown: 0.78,
        damageMul: 1.10, // +10%
        projectile: { textureKey: 'arrow_ice', speed: 31, hitRadius: 0.6 },
        trail: { enabled: true, life: 0.32, interval: 0.02 }
    },
    poison: {
        cooldown: 0.78,
        damageMul: 1.12, // +12%
        projectile: { textureKey: 'arrow_poison', speed: 31, hitRadius: 0.6 },
        trail: { enabled: true, life: 0.33, interval: 0.02 }
    }
};

export default class HeroAttackController {
    hero;
    worldRoot;

    // default in case of no preset
    attackCooldown = 0.75;
    timer = 0;

    range = 30.0;
    enabled = true;

    // pause after hero stops moving («load arrow animation»)
    settleDelaySeconds = 0.05;
    settleTimer = 0;
    wasMoving = false;

    enemyTrack = new Map(); // for future development (enemy speeds)

    // attackTypeKey = 'arrow_basic';
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

    new Projectile(this.worldRoot, startPosition, targetEnemy, finalDamage, projectileOptions);

    let cooldownSeconds = (preset.cooldown ?? 0.75);
    this.timer = cooldownSeconds;
}

    destroy() { app.loop.remove(this.onUpdate); }
}

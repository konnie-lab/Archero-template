// objects/Projectile.mjs
import { Vector3 } from 'three-161';
import { CircleShape, VerletBody } from '../modules/physics/VerletPhysics.mjs';
import { GhostTrail } from '../fx/GhostTrail.mjs';

export default class Projectile {
  parent;
  root;
  sprite;
  body;                 // sensor-body for collisions

  speed = 32;
  hitRadius = 0.6;
  damage = 0;

  targetEnemy = null;   // homing target (EnemyBase)
  fixedDirection = null; // straight flight (Vector3), e.g. side arrows

  maxLifetimeSeconds = 1.8;
  timeAliveSeconds = 0;

  trail = null;         // GhostTrail | null

  // extra payloads
  onHitEffects = null;  // { burn: { tickDamage, ticks, intervalSec } }
  ricochet = null;      // { enabled, chainMaxTargets, chainRadius, hitSet:Set, hitCount:number }

  // flags
  isFinishing = false;  // visual linger after hit → no more logic

  // scratch
  tmpDirection = new Vector3();
  tmpScreenFrom = new Vector3();
  tmpScreenTo = new Vector3();

  constructor(parent, startPosition, targetEnemy, damage, options = {}) {
    this.parent = parent;
    this.root = (parent && parent.worldRoot) ? parent.worldRoot : parent;
    this.targetEnemy = targetEnemy || null;
    this.damage = damage | 0;

    if (!this.root) throw new Error('Projectile: parent must be worldRoot or contain worldRoot');

    // basic options
    let textureKey = options.textureKey || 'arrow_hero';
    if (options.speed) this.speed = options.speed;
    if (options.hitRadius) this.hitRadius = options.hitRadius;

    // straight flight (for multishot side arrows)
    if (options.fixedDirection) {
      let direction = options.fixedDirection;
      let straight = new Vector3(direction.x || 0, direction.y || 0, direction.z || 0);
      if (straight.lengthSq() > 1e-8) straight.normalize(); else straight.set(0, 0, 1);
      this.fixedDirection = straight;
      this.maxLifetimeSeconds = 2.0; // визуально приятный «долет» для прямых
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

    // sprite
    this.sprite = app.three.sprite(textureKey, { scale: 0.02 });
    this.sprite.name = 'HeroProjectile';
    this.sprite.position.copy(startPosition);

    this.sprite.material.depthTest = false;
    this.sprite.material.depthWrite = false;
    this.sprite.material.transparent = true;
    this.sprite.renderOrder = 10;

    this.root.add(this.sprite);

    // sensor-body: ловим enemy / wall. Ничего не считаем вручную.
    let shape = new CircleShape(this.hitRadius);
    this.body = app.phys.addModel(this.sprite, shape, false, true);
    this.body.on(VerletBody.EVENT_COLLIDE, this.onCollide);

    // lifetime для хоуминга — слегка адаптивный к дистанции старта
    if (!this.fixedDirection && this.targetEnemy?.model) {
      let tp = this.targetEnemy.model.position;
      let dx = tp.x - startPosition.x;
      let dy = tp.y - startPosition.y;
      let dz = tp.z - startPosition.z;
      let dist = Math.hypot(dx, dy, dz);
      this.maxLifetimeSeconds = Math.min(3.5, Math.max(0.7, dist / this.speed + 0.5));
    }

    // trail (опционально)
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

    // initial rotation
    this.updateRotationToTargetOrDirection();

    app.loop.add(this.onUpdate);
  }

  // Physics collisions: enemy/wall only. Игрок игнорируем.
  onCollide = (otherBody) => {
    if (this.isFinishing) return;

    if (otherBody?.enemy) {
      // prevent re-hit of the same enemy with ricochet
      if (this.ricochet?.enabled && this.ricochet.hitSet.has(otherBody.enemy)) return;
      this.onHitEnemy(otherBody.enemy);
      return;
    }
    if (otherBody?.isWall) {
      // мягко погасим стрелу у стены (визуально «долетит» доли секунды)
      this.finishVisual(0.04);
      return;
    }
  };

  onUpdate = () => {
    if (this.isFinishing) return;

    let dt = 1 / 40;
    this.timeAliveSeconds += dt;

    if (this.timeAliveSeconds >= this.maxLifetimeSeconds) {
      this.destroy(); // тайм-аут — без хита
      return;
    }

    // integrate
    if (this.fixedDirection) {
      // straight flight
      let step = this.speed * dt;
      this.sprite.position.x += this.fixedDirection.x * step;
      this.sprite.position.y += this.fixedDirection.y * step;
      this.sprite.position.z += this.fixedDirection.z * step;
      this.updateRotationToDirection(this.fixedDirection);
    } else if (this.targetEnemy?.model) {
      // homing: направление к текущей цели на каждом тике
      let from = this.sprite.position;
      let to = this.targetEnemy.model.position;

      this.tmpDirection.set(to.x - from.x, to.y - from.y, to.z - from.z);
      let len = this.tmpDirection.length();
      if (len > 1e-5) this.tmpDirection.multiplyScalar(1 / len); else this.tmpDirection.set(0, 0, 1);

      let step = this.speed * dt;
      this.sprite.position.x += this.tmpDirection.x * step;
      this.sprite.position.y += this.tmpDirection.y * step;
      this.sprite.position.z += this.tmpDirection.z * step;

      this.updateRotationToDirection(this.tmpDirection);
    } else {
      // нет цели и нет прямого направления — гасим
      this.destroy();
      return;
    }

    if (this.trail) this.trail.updateFrom(this.sprite, dt);
  };

  // --- Hit handling (single place; вызовется из onCollide(enemy)) ---
  onHitEnemy(enemyInstance) {
    if (this.isFinishing) return;
    if (enemyInstance.isDead) { this.finishVisual(0.05); return; }

    // direct damage number
    enemyInstance.applyDamage(this.damage);
    app.eventEmitter.emit(app.data.EVENTS.SHOW_DAMAGE_NUMBER, {
      worldObject: enemyInstance.model,
      amount: this.damage | 0,
      color: 0xff3b30,
      yOffset: 2.0
    });

    // burn DoT (optional)
    if (this.onHitEffects?.burn) {
      let burn = this.onHitEffects.burn;
      let tickDamage = Math.max(1, burn.tickDamage | 0);
      let ticks = Math.max(1, burn.ticks | 0);
      let intervalSec = Math.max(0.05, burn.intervalSec || 1.0);
      if (enemyInstance?.addBurnDot) enemyInstance.addBurnDot(tickDamage, ticks, intervalSec);
    }

    // ricochet: retarget and keep flying
    if (this.ricochet?.enabled) {
      this.ricochet.hitSet.add(enemyInstance);
      this.ricochet.hitCount += 1;

      if (this.ricochet.hitCount < this.ricochet.chainMaxTargets) {
        let nextEnemy = this.findNextRicochetTarget(enemyInstance);
        if (nextEnemy) {
          this.targetEnemy = nextEnemy;

          // small lifetime budget so chain has time to fly
          this.timeAliveSeconds = Math.max(0, this.timeAliveSeconds - 0.15);
          this.maxLifetimeSeconds = Math.min(3.8, this.maxLifetimeSeconds + 0.6);

          // rotate towards new target
          this.updateRotationToTargetOrDirection();
          return; // continue flight, no finish
        }
      }
    }

    // no ricochet → soft finish (визуально «долететь» 0.06с)
    this.finishVisual(0.06);
  }

  // Choose next ricochet target near the last hit enemy
  findNextRicochetTarget(fromEnemy) {
    if (!this.root) return null;

    let searchRadius = this.ricochet?.chainRadius || 6.0;
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

  // --- Visual rotation helpers (same principle as EnemyProjectile) ---

  updateRotationToTargetOrDirection() {
    if (this.fixedDirection) { this.updateRotationToDirection(this.fixedDirection); return; }
    if (!this.targetEnemy?.model) return;

    // look along small step towards target in screen space
    let camera = app.three.camera; if (!camera || !this.sprite?.material) return;
    this.tmpScreenFrom.copy(this.sprite.position).project(camera);

    let to = this.targetEnemy.model.position;
    this.tmpDirection.set(to.x - this.sprite.position.x, to.y - this.sprite.position.y, to.z - this.sprite.position.z);
    if (this.tmpDirection.lengthSq() > 1e-8) this.tmpDirection.normalize(); else this.tmpDirection.set(0, 0, 1);

    this.tmpScreenTo.copy(this.sprite.position).addScaledVector(this.tmpDirection, 0.01).project(camera);

    let deltaX = this.tmpScreenTo.x - this.tmpScreenFrom.x;
    let deltaY = this.tmpScreenTo.y - this.tmpScreenFrom.y;
    let angle = -Math.atan2(deltaX, deltaY);
    this.sprite.material.rotation = angle;
    this.sprite.rotation.z = angle;
  }

  updateRotationToDirection(directionVec3) {
    let camera = app.three.camera; if (!camera || !this.sprite?.material || !directionVec3) return;

    this.tmpScreenFrom.copy(this.sprite.position).project(camera);
    this.tmpScreenTo.copy(this.sprite.position).addScaledVector(directionVec3, 0.01).project(camera);

    let deltaX = this.tmpScreenTo.x - this.tmpScreenFrom.x;
    let deltaY = this.tmpScreenTo.y - this.tmpScreenFrom.y;
    let angle = -Math.atan2(deltaX, deltaY);
    this.sprite.material.rotation = angle;
    this.sprite.rotation.z = angle;
  }

  /* ────────────────────── FINISH/DESTROY ────────────────────── */

  // Stop logic & physics right now, keep sprite tiny bit for visual «reach», then remove.
  finishVisual(delaySeconds = 0.06) {
    if (this.isFinishing) return;
    this.isFinishing = true;

    app.loop.remove(this.onUpdate);
    if (this.body) { app.phys.removeBody(this.body); this.body = null; }

    let material = this.sprite?.material;
    if (material) {
      let duration = Math.max(0.01, delaySeconds);
      gsap.to(material, { opacity: 0, duration, ease: 'sine.in' });
    }

    gsap.delayedCall(Math.max(0.01, delaySeconds), () => this.cleanup());
  }

  // Immediate remove (no visual linger). Use for lifetime timeout or hard-cancel.
  destroy() {
    if (this.isFinishing) return;
    this.isFinishing = true;

    app.loop.remove(this.onUpdate);
    if (this.body) { app.phys.removeBody(this.body); this.body = null; }
    this.cleanup();
  }

  cleanup() {
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

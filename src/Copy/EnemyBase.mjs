import { Group, Mesh } from 'three-161';
import * as SkeletonUtils from '../modules/SkeletonUtils.mjs';
import { CircleShape, VerletBody } from '../modules/physics/VerletPhysics.mjs';

export default class EnemyBase {
  scene;
  type = 'enemy';

  model;
  skinnedObject;
  body;

  hp = 1;
  isDead = false;
  moveSpeed = 2.5;

  activeDots = [];   // list of { type:'burn', kill:Function }

  constructor(scene, spawnPosition) {
    this.scene = scene;
    this.initModel(spawnPosition);
    this.initPhysics();
  }

  getModelKey() {
    let map = app.data.GAME_CONFIG?.enemyModels;
    return (map && (map[this.type] || map.fallback)) || 'hen';
  }

  initModel(spawnPosition) {
    this.model = new Group();
    this.model.name = 'Enemy';

    let key = this.getModelKey();
    let sourceScene = app.three.getScene(key);
    this.skinnedObject = SkeletonUtils.clone(sourceScene);
    this.skinnedObject.scale.multiplyScalar(3.5);


    let material = app.three.materials.hen;
    this.skinnedObject.traverse(node => {
      if (node.isSkinnedMesh) {
        if (material) {
          node.material = material;
          if (node.material && node.material.skinning !== true) node.material.skinning = true;
        }
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    let position = spawnPosition || {};
    this.model.position.set(position.x || 0, position.y || 0, position.z || 0);
    this.model.add(this.skinnedObject);

    this.model.userData = this.model.userData || {};
    this.model.userData.enemy = this; // link back for search

    this.scene.worldRoot.add(this.model);
  }

  initPhysics() {
    let circle = new CircleShape(0.6);
    this.body = app.phys.addModel(this.model, circle, false, false);
    this.body.enemy = this;
    this.body.on(VerletBody.EVENT_COLLIDE, this.onCollide);
  }

  onCollide = (otherBody) => {
    if (otherBody?.player && this.scene?.heroHealth) {
      this.scene.heroHealth.tryContactDamage(50);
      console.log('damage')
    }
  };

  start() { app.loop.add(this.onUpdate); }
  stop() { app.loop.remove(this.onUpdate); }
  onUpdate = () => { };

  applyDamage(amount) {
    if (this.isDead) return;
    this.hp -= (amount | 0);
    if (this.hp <= 0) this.kill();
  }

  addBurnDot(tickDamage, ticks = 5, intervalSec = 1.0) {
    if (this.isDead) return;

    let killed = false;
    let index = 0;

    let doTick = () => {
      if (killed || this.isDead) return;

      this.flashRed(); // visual feedback for burn tick
      this.applyDamage(tickDamage);

      app.eventEmitter.emit(app.data.EVENTS.SHOW_DAMAGE_NUMBER, {
        worldObject: this.model,
        amount: tickDamage | 0,
        color: 0xff9900,
        yOffset: 2.4
      });

      index += 1;
      if (index >= ticks) {
        stopTimers();
      } else {
        timerId = gsap.delayedCall(intervalSec, doTick);
      }
    };

    let timerId = gsap.delayedCall(intervalSec, doTick);

    let stopTimers = () => {
      if (killed) return;
      killed = true;
      if (timerId) { timerId.kill?.(); timerId = null; }
    };

    this.activeDots.push({ type: 'burn', kill: stopTimers });
  }

    flashRed() {
    if (!this.skinnedObject) return;

    this.skinnedObject.traverse(node => {
      if (!node.isSkinnedMesh || !node.material) return;

      let meshMaterial = node.material;
      meshMaterial.emissiveIntensity ??= 1;

      if (!meshMaterial.userData.flashBase) {
        meshMaterial.userData.flashBase = {
          colorHex: meshMaterial.emissive?.getHex ? meshMaterial.emissive.getHex() : 0x000000,
          intensity: meshMaterial.emissiveIntensity
        };
      }

      let base = meshMaterial.userData.flashBase;
      if (meshMaterial.emissive?.setRGB) meshMaterial.emissive.setRGB(0.3, 0, 0);

      gsap.to(meshMaterial, {
        emissiveIntensity: (base.intensity || 1) * 2.4,
        duration: 0.12,
        ease: 'power1.out',
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          if (meshMaterial.emissive?.setHex) meshMaterial.emissive.setHex(base.colorHex || 0x000000);
          meshMaterial.emissiveIntensity = base.intensity || 1;
        }
      });
    });
  }

  kill() {
    if (this.isDead) return;
    this.isDead = true;

    // stop updates and physics
    this.stop();
    if (this.body) { app.phys.removeBody(this.body); this.body = null; }

    // clear DoTs timers
    for (let item of this.activeDots) item?.kill?.();
    this.activeDots.length = 0;

    if (this.model?.parent) this.model.removeFromParent();

    app.eventEmitter.emit(app.data.EVENTS.ENEMY_KILLED, { enemy: this });
  }

  destroy() { this.kill(); }
}

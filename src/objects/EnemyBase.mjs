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

  onCollide = (otherBody /*, selfBody */) => {
  // hero body has .player link per Hero.initPhysBody()
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

  kill() {
    if (this.isDead) return;
    this.isDead = true;

    this.stop();
    if (this.body) { app.phys.removeBody(this.body); this.body = null; }
    if (this.model?.parent) this.model.removeFromParent();

    app.eventEmitter.emit(app.data.EVENTS.ENEMY_KILLED, { enemy: this });
  }

  destroy() { this.kill(); }
}

// gameManagers/EnemyManager.mjs
import EnemyArcher from "../objects/EnemyArcher.mjs";
import EnemyMelee from "../objects/EnemyMelee.mjs";
import LootItem from "../objects/LootItem.mjs";

export default class EnemyManager {
  scene;
  enemies = new Set();
  lootItems = new Set();
  gameplayPaused = false;

  constructor(scene) {
    this.scene = scene;
    this.initEvents();
  }

  initEvents() {
    app.eventEmitter.on(app.data.EVENTS.SPAWN_ENEMY, this.onSpawnEnemy);
    app.eventEmitter.on(app.data.EVENTS.ENEMY_KILLED, this.onEnemyKilled);
    app.eventEmitter.on(app.data.EVENTS.WAVE_CLEARED, this.onWaveCleared);

    app.eventEmitter.on(app.data.EVENTS.GAMEPLAY_PAUSE, () => this.pauseAll());
    app.eventEmitter.on(app.data.EVENTS.GAMEPLAY_RESUME, () => this.activateAll());
  }

  pauseAll() {
    this.gameplayPaused = true;
    for (let enemy of this.enemies) if (!enemy.isDead) enemy.stop();
  }

  activateAll() {
    this.gameplayPaused = false;
    for (let enemy of this.enemies) if (!enemy.isDead) enemy.start();
  }

  onSpawnEnemy = ({ type, position, active = true }) => {
    let enemy = null;
    if (type === 'archer') enemy = new EnemyArcher(this.scene, position);
    else if (type === 'melee') enemy = new EnemyMelee(this.scene, position);
    else { console.warn('EnemyManager: unknown enemy type:', type); return; }

    this.enemies.add(enemy);
    if (active && !this.gameplayPaused) enemy.start();
  };

  activateAll() {
    this.gameplayPaused = false;
    for (let enemy of this.enemies) if (!enemy.isDead) enemy.start();
  }

  onEnemyKilled = ({ enemy } = {}) => {
    if (enemy && this.enemies.has(enemy)) this.enemies.delete(enemy);

    let position = enemy?.model?.position;
    let loot = new LootItem(this.scene, {
      x: position?.x ?? 0,
      y: (position?.y ?? 0) + 0.3,
      z: position?.z ?? 0
    });
    this.lootItems.add(loot);
    loot.start();

  };

  onWaveCleared = () => {
    let hero = this.scene.hero?.model;
    if (!hero) return;

    let lootAttractDelaySec = app.data.GAME_CONFIG?.lootAttractDelaySec ?? 1;
    gsap.delayedCall(lootAttractDelaySec, () => {
      for (let loot of this.lootItems) loot.beginAttract(hero);
    });
  };

  destroy() {
    app.eventEmitter.off(app.data.EVENTS.SPAWN_ENEMY, this.onSpawnEnemy);
    app.eventEmitter.off(app.data.EVENTS.ENEMY_KILLED, this.onEnemyKilled);
    app.eventEmitter.off(app.data.EVENTS.WAVE_CLEARED, this.onWaveCleared);

    for (let enemy of this.enemies) enemy.destroy();
    this.enemies.clear();

    for (let loot of this.lootItems) loot.destroy();
    this.lootItems.clear();
  }
}

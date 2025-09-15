import EnemyBase from './EnemyBase.mjs';

export default class EnemyArcher extends EnemyBase {
  type = 'archer';

  roamDurationSec = app.data.GAME_CONFIG.enemy.archer.roamTime; // 2
  roamTimer = 0;
  moveSpeed = 2.2;
  shotFiredInCycle = false;

  constructor(scene, spawnPosition) {
    super(scene, spawnPosition);
    this.hp = app.data.GAME_CONFIG.enemy.archer.hp;
    this.pickNewRoamDirection();
  }

  pickNewRoamDirection() {
    let angle = Math.random() * Math.PI * 2;
    this.roamDirX = Math.cos(angle);
    this.roamDirZ = Math.sin(angle);
  }

  onUpdate = () => {
    let dt = 1 / 40;

    if (this.roamTimer < this.roamDurationSec) {
        let step = this.moveSpeed * dt;
        this.model.position.x += this.roamDirX * step;
        this.model.position.z += this.roamDirZ * step;
        this.roamTimer += dt;
        return;
    }

    this.roamTimer += dt;

    if (!this.shotFiredInCycle) {
        this.shotFiredInCycle = true;
        app.eventEmitter.emit('enemy_try_shoot', { enemy: this, target: this.scene.hero?.model });
    }

    if (this.roamTimer >= this.roamDurationSec + 0.5) {
        this.roamTimer = 0;
        this.shotFiredInCycle = false;
        this.pickNewRoamDirection();
    }
};
}

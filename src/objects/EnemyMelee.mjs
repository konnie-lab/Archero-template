import EnemyBase from './EnemyBase.mjs';

export default class EnemyMelee extends EnemyBase {
  type = 'melee';

  moveSpeed = 3.2;
  chargeCooldownSec = app.data.GAME_CONFIG.enemy.melee.chargeCd; // 3
  telegraphTimeSec = app.data.GAME_CONFIG.enemy.melee.telTime;   // ~0.7
  lungeSpeed = app.data.GAME_CONFIG.enemy.melee.lungeSpeed;      // 10

  state = 'chase'; // 'chase' | 'telegraph' | 'lunge' | 'cooldown'
  timer = 0;

  constructor(scene, spawnPosition) {
    super(scene, spawnPosition);
    this.hp = app.data.GAME_CONFIG.enemy.melee.hp;
  }

  onUpdate = () => {
    let dt = 1 / 40;

    switch (this.state) {
      case 'chase': {
        this.moveTowardsHero(dt, this.moveSpeed);
        this.timer += dt;
        if (this.timer >= this.chargeCooldownSec) {
          this.timer = 0;
          this.state = 'telegraph';
          app.eventEmitter.emit('melee_telegraph_start', { enemy: this, duration: this.telegraphTimeSec });
        }
        break;
      }

      case 'telegraph': {
        this.timer += dt;
        if (this.timer >= this.telegraphTimeSec) {
          this.timer = 0;
          this.state = 'lunge';
          let hero = this.scene.hero?.model;
          if (hero) {
            let dx = hero.position.x - this.model.position.x;
            let dz = hero.position.z - this.model.position.z;
            let length = Math.hypot(dx, dz) || 1;
            this.lungeDirX = dx / length;
            this.lungeDirZ = dz / length;
          } else {
            this.lungeDirX = 0; this.lungeDirZ = 1;
          }
        }
        break;
      }

      case 'lunge': {
        let step = this.lungeSpeed * dt;
        this.model.position.x += this.lungeDirX * step;
        this.model.position.z += this.lungeDirZ * step;

        this.timer += dt;
        if (this.timer >= 0.25) {
          this.timer = 0;
          this.state = 'cooldown';
        }
        break;
      }

      case 'cooldown': {
        this.timer += dt;
        if (this.timer >= 0.35) {
          this.timer = 0;
          this.state = 'chase';
        }
        break;
      }
    }
  };

  moveTowardsHero(dt, speed) {
    let hero = this.scene.hero?.model;
    if (!hero) return;

    let dx = hero.position.x - this.model.position.x;
    let dz = hero.position.z - this.model.position.z;
    let length = Math.hypot(dx, dz);

    if (length > 1e-3) {
      let dirX = dx / length;
      let dirZ = dz / length;
      let step = speed * dt;

      this.model.position.x += dirX * step;
      this.model.position.z += dirZ * step;

      this.model.rotation.y = Math.atan2(dirX, dirZ);
    }
  }
}
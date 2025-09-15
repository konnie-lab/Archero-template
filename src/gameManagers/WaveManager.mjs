// gameManagers/WaveManager.mjs
import SpawnMarkerFX from '../fx/SpawnMarkerFX.mjs';

export default class WaveManager {
  scene;

  activeWaveNumber = 0;
  aliveEnemiesCount = 0;

  waveIntroTime   = 1.5;  // how long to show spawn markers
  resumeDelaySec  = 0.5;  // pause after enemies appear before the start of the battle

  markerRefs = [];
  telegraphTimerId = null;
  resumeTimerId = null;
  isPaused = false;

  constructor(scene) {
    this.scene = scene;
    this.initEvents();
  }

  initEvents() {
    app.eventEmitter.on(app.data.EVENTS.WAVE_START, this.onWaveStart);
    app.eventEmitter.on(app.data.EVENTS.ENEMY_KILLED, this.onEnemyKilled);
  }

  onWaveStart = ({ wave }) => {
    this.clearTimers();
    this.clearMarkers();

    this.activeWaveNumber = wave || 1;

    let waveConfig = app.data.GAME_CONFIG.waves[this.activeWaveNumber];
    if (!waveConfig || !Array.isArray(waveConfig.enemies) || waveConfig.enemies.length === 0) {
      console.warn('[WaveManager] wave config empty for', this.activeWaveNumber);
      return;
    }

    this.pauseGameplay();

    let positions = [];
    for (let enemy of waveConfig.enemies) {
      let position = { x: enemy.position?.x || 0, y: enemy.position?.y || 0, z: enemy.position?.z || 0 };
      positions.push(position);
      this.markerRefs.push(new SpawnMarkerFX(this.scene.worldRoot, position, this.waveIntroTime));
    }
    app.eventEmitter.emit(app.data.EVENTS.WAVE_INTRO_START, { wave: this.activeWaveNumber, positions });

    this.telegraphTimerId = window.setTimeout(() => {
      this.telegraphTimerId = null;
      this.clearMarkers();
      app.eventEmitter.emit(app.data.EVENTS.WAVE_INTRO_END, { wave: this.activeWaveNumber });

      this.aliveEnemiesCount = waveConfig.enemies.length;

      for (let enemyInfo of waveConfig.enemies) {
        let position = { y: 0, ...enemyInfo.position };
        app.eventEmitter.emit(app.data.EVENTS.SPAWN_ENEMY, {
          type: enemyInfo.type,
          position,
          wave: this.activeWaveNumber,
          active: false, 
        });
      }

      this.resumeTimerId = window.setTimeout(() => {
        this.resumeTimerId = null;
        this.resumeGameplay();
      }, this.resumeDelaySec * 1000);
    }, this.waveIntroTime * 1000);
  };

  onEnemyKilled = () => {
    if (this.aliveEnemiesCount > 0) this.aliveEnemiesCount -= 1;
    if (this.aliveEnemiesCount === 0) {
      app.eventEmitter.emit(app.data.EVENTS.WAVE_CLEARED);
    }
  };

  /*──────────────── helpers ───────────────*/

  pauseGameplay() {
    if (this.isPaused) return;
    this.isPaused = true;
    app.eventEmitter.emit(app.data.EVENTS.GAMEPLAY_PAUSE);
    app.eventEmitter.emit(app.data.EVENTS.HERO_CANNOT_ATTACK);
  }

  resumeGameplay() {
    if (!this.isPaused) return;
    this.isPaused = false;
    app.eventEmitter.emit(app.data.EVENTS.GAMEPLAY_RESUME);
    app.eventEmitter.emit(app.data.EVENTS.HERO_CAN_ATTACK);
  }

  clearMarkers() {
    for (const marker of this.markerRefs) marker?.destroy();
    this.markerRefs.length = 0;
  }

  clearTimers() {
    if (this.telegraphTimerId) {
      window.clearTimeout(this.telegraphTimerId);
      this.telegraphTimerId = null;
    }
    if (this.resumeTimerId) {
      window.clearTimeout(this.resumeTimerId);
      this.resumeTimerId = null;
    }
  }

  destroy() {
    this.clearTimers();
    this.clearMarkers();
    app.eventEmitter.off(app.data.EVENTS.WAVE_START, this.onWaveStart);
    app.eventEmitter.off(app.data.EVENTS.ENEMY_KILLED, this.onEnemyKilled);
  }
}

import { StateManager } from '../modules/managers/StateManager.mjs';
import { IntroState, WaveState, ShowBoostsState, FailState } from './GameFlowStates.mjs';

export default class GameController {
  scene;
  fsm;
  currentWave = 0;

  constructor(scene) {
    this.scene = scene;
    this.initFSM();
    this.initEvents();
    this.bindFirstInput();
  }

  initEvents() {
    app.eventEmitter.on(app.data.EVENTS.WAVE_CLEARED, this.onWaveCleared);
    app.eventEmitter.on(app.data.EVENTS.PLAYER_DIED, this.onPlayerDied);
    app.eventEmitter.on(app.data.EVENTS.BOOST_SELECTED, this.onBoostSelected);
  }

  bindFirstInput() {
    app.pixi.stage.once('pointerdown', () => {
      app.eventEmitter.emit(app.data.EVENTS.GAME_START);
    });
  }

  initFSM() {
    this.fsm = new StateManager();
    this.fsm.add(
      new IntroState(this),
      new WaveState(this),
      new ShowBoostsState(this),
      new FailState(this),
    );
    this.fsm.set(IntroState);
  }

  // callbacks
  onWaveCleared = () => {
    this.fsm.set(ShowBoostsState, { wave: this.currentWave });
  };

  onPlayerDied = () => {

    this.scene?.playerJoystick?.stop?.();
    this.scene?.hero?.setSpeed?.(0);
    app.eventEmitter.emit(app.data.EVENTS.GAMEPLAY_PAUSE);
    app.eventEmitter.emit(app.data.EVENTS.HERO_CANNOT_ATTACK);

    let delayBeforeShowFail = app.data.GAME_CONFIG?.delayBeforeShowFail ?? 1;
    gsap.delayedCall(delayBeforeShowFail, () => {
      this.scene?.failBanner?.show?.();
    });

  };

  onBoostSelected = ({ key }) => {
    this.scene?.heroAttack?.setAttackKey?.(key);

    if (this.currentWave === 1) {
      this.fsm.set(WaveState, { wave: 2 });
    } else {
      app.eventEmitter.emit(app.data.EVENTS.OPEN_STORE);
    }
  };

  // API for states
  startWave(waveNumber) {
    this.currentWave = waveNumber;
    app.eventEmitter.emit(app.data.EVENTS.WAVE_START, { wave: waveNumber });
  }

  showBoostsFor(waveNumber) {
    app.eventEmitter.emit(app.data.EVENTS.SHOW_BOOSTS, { wave: waveNumber });
  }

  destroy() {
    app.eventEmitter.off(app.data.EVENTS.WAVE_CLEARED, this.onWaveCleared);
    app.eventEmitter.off(app.data.EVENTS.PLAYER_DIED, this.onPlayerDied);
    app.eventEmitter.off(app.data.EVENTS.BOOST_SELECTED, this.onBoostSelected);
    app.eventEmitter.off(app.data.EVENTS.BOOST_AUTOSELECT, this.onBoostSelected);
  }
}

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
    app.eventEmitter.on(app.data.EVENTS.BOOST_AUTOSELECT, this.onBoostSelected);
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
    this.scene?.playerJoystick?.setEnabled?.(false);
    this.scene?.hero?.setSpeed?.(0);
    this.fsm.set(FailState);
  };

  onBoostSelected = ({ key }) => {
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

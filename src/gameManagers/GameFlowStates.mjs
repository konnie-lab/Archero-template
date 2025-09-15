import { State, Predicate } from '../modules/managers/StateManager.mjs';

// Intro — waits for first input (GAME_START) then goes WaveState(wave=1)
export class IntroState extends State {
    controller;
    started = false;

    constructor(controller) {
        super();
        this.controller = controller;
        this.addPredicate(new IntroStartPredicate(this));
    }

    enter() { this.started = false; }
    update() { }
    exit() { }
}

class IntroStartPredicate extends Predicate {
    state;
    handler = () => {
        if (this.state.started) return;
        this.state.started = true;
        this.state.stateMachine.set(WaveState, { wave: 1 });
    };

    constructor(state) {
        super();
        this.state = state;
        app.eventEmitter.once(app.data.EVENTS.GAME_START, this.handler);
    }

    check() { } // event-driven
}

// Wave — notifies WaveManager to spawn, waits for WAVE_CLEARED
export class WaveState extends State {
    controller;
    waveNumber = 1;

    constructor(controller) {
        super();
        this.controller = controller;
    }

    enter(params) {
        this.waveNumber = (params && params.wave) || 1;
        this.controller.startWave(this.waveNumber);
    }

    update() { }
    exit() { }
}

// ShowBoosts — shows UI, fires hint (5s) and autoselect (15s)
export class ShowBoostsState extends State {
    controller;
    waveNumber = 1;
    hintTimerId = null;
    autoTimerId = null;

    constructor(controller) {
        super();
        this.controller = controller;
    }

    enter(params) {
        this.waveNumber = (params && params.wave) || 1;
        this.controller.showBoostsFor(this.waveNumber);

        let config = app.data.GAME_CONFIG;

        this.clearTimers();
        this.hintTimerId = window.setTimeout(() => {
            app.eventEmitter.emit(app.data.EVENTS.BOOST_TIMEOUT_HINT);
        }, config.boostsTimeoutHintSec * 1000);

        this.autoTimerId = window.setTimeout(() => {
            app.eventEmitter.emit(
                app.data.EVENTS.BOOST_AUTOSELECT,
                { key: config.boostsAutoPickKey }
            );
        }, config.boostsAutoPickSec * 1000);
    }

    update() { }
    exit() { this.clearTimers(); }

    clearTimers() {
        if (this.hintTimerId) window.clearTimeout(this.hintTimerId);
        if (this.autoTimerId) window.clearTimeout(this.autoTimerId);
        this.hintTimerId = null;
        this.autoTimerId = null;
    }
}

// Fail — show packshot, any tap opens store
export class FailState extends State {
    controller;

    constructor(controller) {
        super();
        this.controller = controller;
    }

    enter() {
        app.eventEmitter.emit(app.data.EVENTS.ACTIVATE_PACK_SHOT);
        app.pixi.stage.once('pointerdown', () => {
            app.eventEmitter.emit(app.data.EVENTS.OPEN_STORE);
        });
    }

    update() { }
    exit() { }
}


export default class SoundService {
    constructor() {
        this.initEvents();
    }   

    initEvents() {
        app.eventEmitter.on(app.data.SOUND_EVENTS.START_MUSIC, this.onStartMusic);
        app.eventEmitter.on(app.data.SOUND_EVENTS.STOP_MUSIC, this.onStopMusic);
    }

    unInitEvents() {
        app.eventEmitter.off(app.data.SOUND_EVENTS.START_MUSIC, this.onStartMusic);
        app.eventEmitter.off(app.data.SOUND_EVENTS.STOP_MUSIC, this.onStopMusic);
    }

    onStartMusic() {
        app.sound.play("music", { loop: true, volume: 0.0 });
        app.sound.fadeIn("music", 0.2, 0.5);
    }

    onStopMusic() {
        app.sound.fadeOut("music", 1);
    }

    destroy() {
        this.unInitEvents();
    }
}
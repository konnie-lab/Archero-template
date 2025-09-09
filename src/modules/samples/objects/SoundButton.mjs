import { Container } from "pixi-7.4.2";

export default class SoundButton {
    /**@type {Container} */
    display;

    #soundOn;
    #soundOff;
    #isMuted = false;

    constructor() {
        this.display = new Container();

        if ( !app.settings.isSounds ) return;
        if ( !app.settings.isSoundButton ) return;
        
        this.display.eventMode = 'static';
        this.display.on('pointertap', this.#onPointerTap.bind(this));

        this.#soundOn = app.pixi.sprite('soundOn');
        this.#soundOn.anchor.set(0.5);

        this.#soundOff = app.pixi.sprite('soundOff');
        this.#soundOff.anchor.set(0.5);
        this.#soundOff.visible = false;

        this.display.addChild(
            this.#soundOn,
            this.#soundOff,
        );

        app.resize.add(this.#onResize.bind(this));
    }

    #onPointerTap() {
        this.#isMuted = !this.#isMuted;
        this.#soundOn.visible = !this.#isMuted;
        this.#soundOff.visible = this.#isMuted;
        this.#isMuted? app.sound.mute() : app.sound.unmute();
    }

    #onResize() {
        this.display.position.set(app.width-60, app.height-55);
    }
}
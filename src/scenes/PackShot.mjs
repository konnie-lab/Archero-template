import { Container } from "pixi-7.4.2";

export default class PackShot {
    constructor(scene) {
        this.scene = scene;
        this.display = new Container();
        this.display.eventMode = 'static';

        this.initEvents();

        app.resize.add(this.onResize);
        this.onResize();

        this.playCinematic();
    }

    /**=================================
     *           EVENTS
     ==================================*/

    initEvents() {
        this.display.on('pointerdown', () => {
            app.eventEmitter.emit(app.data.EVENTS.OPEN_STORE)
            app.gameEnd();
        });
    }

    /**=================================
     *           CINEMATIC
     ==================================*/

    playCinematic() {
        let timeline = gsap.timeline();
    }

    onResize = () => {

        if (app.isPortrait) {

            if (app.ratioLess('SM')) {
            }
        } else {

            if (app.ratioLess('SM')) {
            }
        }
    };

}
import { Container } from "pixi-7.4.2";

export default class DownloadButton {
    /** @type {Container} */
    display;

    constructor() {
        if (app.settings.isDownloadButton) {
            this.display = app.pixi.sprite('downloadBtn');
            this.display.anchor.set(0.5);
            this.display.scale.set(0.7);

            this.display.eventMode = 'static';
            this.display.on('pointertap', this.#onPointerTap.bind(this));

            app.resize.add(this.#onResize.bind(this));
        } else {
            this.display = new Container();
        }        
    }

    #onPointerTap() {
       app.openStore();
    }

    #onResize() {
        if ( app.isPortrait ) {
            this.display.position.set(app.width/2, app.height - 90);
        } else {
            this.display.position.set(160, app.height - 80);
        }        
    }

    hide() {
        app.gsap.to(this.display, 0.5, {alpha: 0, onComplete: ()=>{
            this.display.visible = false;
        }});
    }
}
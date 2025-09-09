import { Container, Rectangle } from "pixi-7.4.2";

export default class MisClickLayer {
    display;    

    constructor( showPackshot ) {
        this.showPackshot = showPackshot;

        this.display = new Container();
        this.display.hitArea = new Rectangle();

        this.display.eventMode = 'static';
        this.display.once('pointerdown', this.#onPointerTap.bind(this));

        app.resize.add(this.#onResize.bind(this));
    }

    #onPointerTap() {
        app.openStore();
        if (this.showPackshot) this.showPackshot();
        this.display.visible = false;
    }

    #onResize() {
        this.display.hitArea.width = app.width;
        this.display.hitArea.height = app.height;
    }
}
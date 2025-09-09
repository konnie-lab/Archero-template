export default class Background {
    display;

    constructor(imageName) {
        this.display = app.pixi.sprite(imageName);
        this.display.anchor.set(0.5);

        app.resize.add( this.#onResize.bind(this) );
    }

    #onResize() {
        this.display.x = app.width / 2;
        this.display.y = app.height / 2;
    }
}
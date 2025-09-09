import SoundButton from "./modules/samples/objects/SoundButton.mjs";
import PlayableManager from "./PlayableManager.mjs";
import GameScene from "./scenes/GameScene.mjs";
import { FONT_DATA_BERLIN_SANS_DEMI_BOLD } from "./ui/fonts.mjs";

import { BitmapFont, Rectangle } from "pixi-7.4.2";

export default class Main {
    /**@type {GameScene} */
    gameScene;
    #soundBtn;

    init() {
        this.initFont();
        this.initGameLayers();

        app.stage.eventMode = 'static';
        app.stage.hitArea = new Rectangle(0, 0, 1390, 1390);

        this.gameScene = new GameScene();
        this.#soundBtn = new SoundButton();

        app.stage.addChild(this.gameScene.display, this.#soundBtn.display);

        this.manager = new PlayableManager(this.gameScene);

        this.initLayerOrder();
    }

    initFont() {
        // "BerlinSansFBDemi-Bold"
        BitmapFont.install(
            FONT_DATA_BERLIN_SANS_DEMI_BOLD,
            app.pixi.texture("fonts/BerlinSansFBDemi-Bold")
        );
    }

    initGameLayers() {
        app.packShotLayer = app.pixi.container();
        app.stage.addChild(app.packShotLayer);

        app.overlayLayer = app.pixi.container();
        app.stage.addChild(app.overlayLayer);

        app.tutorLayer = app.pixi.container();
        app.stage.addChild(app.tutorLayer);

        app.fxLayer = app.pixi.container();
        app.stage.addChild(app.fxLayer);
    }

    initLayerOrder() {
        app.stage.setChildIndex(app.fxLayer, app.stage.children.length - 1);
        app.stage.setChildIndex(app.overlayLayer, app.stage.children.length - 1);
        app.stage.setChildIndex(app.tutorLayer, app.stage.children.length - 1);
        app.stage.setChildIndex(app.packShotLayer, app.stage.children.length - 1);
        app.packShotLayer.eventMode = 'static';
        app.packShotLayer.sortableChildren = true;
        // sound button always on top
        app.stage.setChildIndex(this.#soundBtn.display, app.stage.children.length - 1);
    }
}







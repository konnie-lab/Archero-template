export default class Interactive3D {
    mouse = {x: 0, y: 0, isDown: false};

    initPointerHandlers() {
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);

        app.pixi.stage.eventMode = 'static';
        app.pixi.stage.on('pointerdown', this.onPointerDown);
        app.pixi.stage.on('pointermove', this.onPointerMove);
        app.pixi.stage.on('pointerup', this.onPointerUp);
        app.pixi.stage.on('pointerupoutside', this.onPointerUp);
        app.pixi.stage.on('pointercancel', this.onPointerUp);
    }

    uninitPointerHandlers() {
        app.pixi.stage.eventMode = 'static';
        app.pixi.stage.off('pointerdown', this.onPointerDown);
        app.pixi.stage.off('pointermove', this.onPointerMove);
        app.pixi.stage.off('pointerup', this.onPointerUp);
        app.pixi.stage.off('pointerupoutside', this.onPointerUp);
        app.pixi.stage.off('pointercancel', this.onPointerUp);
    }

    onPointerDown() {}

    onPointerMove() {}

    onPointerUp() {}
}
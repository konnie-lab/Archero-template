import { Container, Point } from 'pixi-7.4.2';
import { Object3D }         from 'three-161';

export class Hand {

    constructor(handTexture = 'hand', layer = app.tutorLayer) {

        this.display = new Container();
        layer.addChild(this.display);

        this.tmpObject3D = new Object3D();
        this.tmpPoint2D  = new Point();

        this.hand = app.pixi.sprite(handTexture, { anchor: 0 });
        this.hand.alpha = 0;
        this.hand.scale.set(0.25);

        this.display.addChild(this.hand);
    }


}

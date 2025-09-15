// fx/DamageNumbersFX.mjs
import { Container, BitmapText, Point } from "pixi-7.4.2";
import { Object3D, Vector3 } from "three-161";

export default class DamageNumbersFX {
  display;
  tempObject3D;
  tempPoint2D;

  fontName = "BerlinSansFBDemi-Bold"; 
  fontSize = 36;
  defaultYOffset = 2.0;   

  constructor(layer = app.fxLayer) {
    this.display = new Container();
    layer.addChild(this.display);

    this.tempObject3D = new Object3D();
    this.tempPoint2D = new Point();

    app.eventEmitter.on(app.data.EVENTS.SHOW_DAMAGE_NUMBER, this.onShowNumber);
  }

  destroy() {
    app.eventEmitter.off(app.data.EVENTS.SHOW_DAMAGE_NUMBER, this.onShowNumber);
    this.display.destroy({ children: true });
  }

  worldToScreen(worldPosition) {
    this.tempObject3D.position.copy(worldPosition);
    app.three.position3DTo2D({
      object3d: this.tempObject3D,
      position2d: this.tempPoint2D
    });
    return this.tempPoint2D.clone();
  }

  onShowNumber = ({ worldObject, amount = 0, color = 0xffffff, yOffset } = {}) => {
    if (!worldObject) return;

    let source3D = worldObject.isObject3D ? worldObject : worldObject.model;
    if (!source3D?.isObject3D) return;

    let worldPosition = new Vector3();
    source3D.getWorldPosition(worldPosition);
    worldPosition.y += (yOffset != null ? yOffset : this.defaultYOffset);

    let globalPoint2D = this.worldToScreen(worldPosition);
    let localPoint2D = this.display.toLocal(globalPoint2D);

    let textNode = new BitmapText(`-${amount | 0}`, {
      fontName: this.fontName,
      fontSize: this.fontSize,
      align: "center",
    });
    textNode.anchor.set(0.5);
    textNode.tint = color;
    textNode.position.copyFrom(localPoint2D);
    this.display.addChild(textNode);

    let risePixels = 46;
    gsap.fromTo(
      textNode.scale,
      { x: 0.9, y: 0.9 },
      { x: 1.1, y: 1.1, duration: 0.14, ease: "sine.out" }
    );
    gsap.to(textNode, { y: textNode.y - risePixels, duration: 0.65, ease: "sine.out" });
    gsap.to(textNode, {
      alpha: 0,
      duration: 0.45,
      ease: "sine.in",
      delay: 0.2,
      onComplete: () => textNode.destroy()
    });
  };
}

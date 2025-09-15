// objects/LootItem.mjs
export default class LootItem {
  scene;
  sprite;

  isAttracting = false;
  targetObject = null;
  attractSpeed = 10.0; 
  pickupDistance = 0.4;

  // offset after spawn
  initialVelocityX = 0;
  initialVelocityZ = 0;
  velocityDampingPerSecond = 4.5;

  constructor(scene, position) {
    this.scene = scene;

    this.sprite = app.three.sprite('coin', { scale: 0.005 });
    this.sprite.name = 'LootCoin';
    this.sprite.position.set(
      position.x || 0,
      (position.y ?? 0) + 0.03,
      position.z || 0
    );

    let material = this.sprite.material;
    if (material) {
      material.transparent = false; 
      material.alphaTest = 0.3;  
      material.depthTest = true;
      material.depthWrite = true;
      material.needsUpdate = true;
    }

    // little "kick" in the side when appearing
    let randomAngle = Math.random() * Math.PI * 2;
    let initialSpeed = 1.6;
    this.initialVelocityX = Math.cos(randomAngle) * initialSpeed;
    this.initialVelocityZ = Math.sin(randomAngle) * initialSpeed;

    this.scene.worldRoot.add(this.sprite);
  }

  start() { app.loop.add(this.onUpdate); }
  stop()  { app.loop.remove(this.onUpdate); }

  beginAttract(targetObject3D) {
    this.targetObject = targetObject3D;
    this.isAttracting = true;

    this.initialVelocityX = 0;
    this.initialVelocityZ = 0;
  }

  onUpdate = () => {
    let deltaSeconds = 1 / 40;
    this.lifetimeSeconds += deltaSeconds;

    if (this.isAttracting && this.targetObject) {
      let deltaX = this.targetObject.position.x - this.sprite.position.x;
      let deltaZ = this.targetObject.position.z - this.sprite.position.z;
      let distance = Math.hypot(deltaX, deltaZ);

      if (distance <= this.pickupDistance) {
        this.destroy();
        return;
      }

      let inverseLength = 1 / (distance || 1);
      let directionX = deltaX * inverseLength;
      let directionZ = deltaZ * inverseLength;

      let step = this.attractSpeed * deltaSeconds;
      this.sprite.position.x += directionX * step;
      this.sprite.position.z += directionZ * step;

      this.attractSpeed = Math.min(16.0, this.attractSpeed + 12.0 * deltaSeconds);
      return;
    }

    if (Math.abs(this.initialVelocityX) > 0.001 || Math.abs(this.initialVelocityZ) > 0.001) {
      this.sprite.position.x += this.initialVelocityX * deltaSeconds;
      this.sprite.position.z += this.initialVelocityZ * deltaSeconds;

      let damping = Math.max(0, 1 - this.velocityDampingPerSecond * deltaSeconds);
      this.initialVelocityX *= damping;
      this.initialVelocityZ *= damping;
    }
  };

  destroy() {
    this.stop();
    if (this.sprite?.parent) this.sprite.removeFromParent();
    this.sprite = null;
  }
}

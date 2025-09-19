// objects/LootItem.mjs
export default class LootItem {
  scene;
  sprite;

  isAttracting = false;
  targetObject = null;
  attractSpeed = 10.0; 
  pickupDistance = 0.4;

  // planar velocity from spawn "kick"
  initialVelocityX = 0;
  initialVelocityZ = 0;
  velocityDampingPerSecond = 4.5;

  // --- spin only (no tilt) ---
  angularVelocityZ = 0;            // rad/sec
  angularDampingPerSecond = 3.0;   // how fast spin fades
  approxRadiusMeters = 0.12;       // used to map v -> ω (ω ≈ v/r)

  lifetimeSeconds = 0;

  constructor(scene, position) {
    this.scene = scene;

    this.sprite = app.three.sprite('gem', { scale: 0.0045 });
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

    // set initial spin proportional to kick speed (ω ≈ v/r)
    let planarSpeed = Math.hypot(this.initialVelocityX, this.initialVelocityZ);
    let randomSign = Math.random() < 0.5 ? -1 : 1;
    this.angularVelocityZ = (planarSpeed / Math.max(0.05, this.approxRadiusMeters)) * 0.6 * randomSign;

    this.scene.worldRoot.add(this.sprite);
  }

  start() { app.loop.add(this.onUpdate); }
  stop()  { app.loop.remove(this.onUpdate); }

  beginAttract(targetObject3D) {
    this.targetObject = targetObject3D;
    this.isAttracting = true;

    // kill inertial drift for straight fly-in
    this.initialVelocityX = 0;
    this.initialVelocityZ = 0;

    // optional: small spin boost when attraction starts
    this.angularVelocityZ += 3.5 * (Math.random() < 0.5 ? -1 : 1);
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

      // light spin damping while flying in
      this.applySpin(deltaSeconds);
      return;
    }

    // inertial drift after spawn
    if (Math.abs(this.initialVelocityX) > 0.001 || Math.abs(this.initialVelocityZ) > 0.001) {
      this.sprite.position.x += this.initialVelocityX * deltaSeconds;
      this.sprite.position.z += this.initialVelocityZ * deltaSeconds;

      // linear damping
      let damping = Math.max(0, 1 - this.velocityDampingPerSecond * deltaSeconds);
      this.initialVelocityX *= damping;
      this.initialVelocityZ *= damping;

      // keep spin roughly matched to current speed (ω ≈ v/r)
      let planarSpeed = Math.hypot(this.initialVelocityX, this.initialVelocityZ);
      let targetOmega = planarSpeed / Math.max(0.05, this.approxRadiusMeters);
      let spinSign = this.angularVelocityZ >= 0 ? 1 : -1;
      let follow = 6.0; // response speed to velocity changes
      this.angularVelocityZ += (targetOmega * spinSign - this.angularVelocityZ) * Math.min(1, follow * deltaSeconds);
    } else {
      // fade remaining spin when fully stopped
      this.angularVelocityZ *= Math.max(0, 1 - this.angularDampingPerSecond * deltaSeconds);
      if (Math.abs(this.angularVelocityZ) < 0.02) this.angularVelocityZ = 0;
    }

    this.applySpin(deltaSeconds);
  };

  // --- spin helper (works for SpriteMaterial or Object3D) ---
  applySpin(deltaSeconds) {
    if (!this.angularVelocityZ) return;

    let rotationStep = this.angularVelocityZ * deltaSeconds;

    if (this.sprite?.material && typeof this.sprite.material.rotation === 'number') {
      // three.js SpriteMaterial has its own rotation
      this.sprite.material.rotation += rotationStep;
    } else {
      // fallback for Plane/Mesh or custom sprite wrapper
      this.sprite.rotation.z += rotationStep;
    }

    // generic damping
    this.angularVelocityZ *= Math.max(0, 1 - this.angularDampingPerSecond * deltaSeconds);
    if (Math.abs(this.angularVelocityZ) < 0.02) this.angularVelocityZ = 0;
  }

  destroy() {
    this.stop();
    if (this.sprite?.parent) this.sprite.removeFromParent();
    this.sprite = null;
  }
}

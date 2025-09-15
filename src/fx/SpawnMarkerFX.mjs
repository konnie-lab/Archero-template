// fx/SpawnMarkerFX.mjs
import { Group, Vector3 } from 'three-161';

export default class SpawnMarkerFX {
  constructor(parentGroup, worldPos, lifeSeconds = 1.5, targetScale = 0.9) {
    let position = worldPos
      ? new Vector3(worldPos.x || 0, worldPos.y || 0, worldPos.z || 0)
      : new Vector3(0, 0, 0);

    this.root = new Group();
    this.root.position.copy(position);
    parentGroup.add(this.root);

    this.sprite = app.three.sprite('enemy_spawn', { scale: 0.06 });
    this.sprite.name = 'SpawnMarker';
    this.root.add(this.sprite);

    let material = this.sprite.material;
    if (material) {
      material.transparent = true;
      material.depthTest = false;   
      material.depthWrite = false;
      material.opacity = 0;
    }
    this.sprite.renderOrder = 2;

    this.sprite.scale.set(0, 0, 0);
    gsap.to(this.sprite.scale, {
      x: targetScale, y: targetScale, z: targetScale,
      duration: Math.min(0.8, lifeSeconds * 0.8),
      ease: 'back.out(2)'
    });

      gsap.to(material, { opacity: 1, duration: 0.15, ease: 'sine.out' });
      gsap.to(material, {
        opacity: 0,
        duration: 0.25,
        ease: 'sine.in',
        delay: Math.max(0, lifeSeconds - 0.25),
        onComplete: () => this.destroy()
      });
  }

  destroy() {
    if (this.root?.parent) this.root.removeFromParent();
    this.root = null;
    this.sprite = null;
  }
}

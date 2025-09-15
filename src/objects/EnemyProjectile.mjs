import { Vector3 } from 'three-161';
import { CircleShape, VerletBody } from '../modules/physics/VerletPhysics.mjs';

export default class EnemyProjectile {
    root;
    sprite;
    body;

    speed = 26;
    hitRadius = 0.6;
    damage = 60;

    targetPoint = null;     // Vector3 snapshot
    direction = null;       // normalized Vector3
    maxLifetimeSeconds = 2.5;
    timeAliveSeconds = 0;

    screenTmpFrom = new Vector3();
    screenTmpTo = new Vector3();

    constructor(root, startPosition, targetPointSnapshot, options = {}) {
        this.root = root;
        this.targetPoint = targetPointSnapshot?.clone() || null;

        if (options.speed) this.speed = options.speed;
        if (options.hitRadius) this.hitRadius = options.hitRadius;
        if (options.damage) this.damage = options.damage;

        let textureKey = options.textureKey || 'arrow_enemy';
        this.sprite = app.three.sprite(textureKey, { scale: 0.02 });
        this.sprite.name = 'EnemyProjectile';
        this.sprite.position.copy(startPosition);

        this.sprite.material.depthTest = false;
        this.sprite.material.depthWrite = false;
        this.sprite.material.transparent = true;
        this.sprite.renderOrder = 10;

        this.root.add(this.sprite);

        // precompute straight direction to snapshot
        let direction = new Vector3(
            this.targetPoint.x - startPosition.x,
            this.targetPoint.y - startPosition.y,
            this.targetPoint.z - startPosition.z
        );
        if (direction.lengthSq() > 1e-8) direction.normalize(); else direction.set(0, 0, 1);
        this.direction = direction;

        // sensor-body for collisions (hero, walls)
        let shape = new CircleShape(this.hitRadius);
        this.body = app.phys.addModel(this.sprite, shape, false, true);
        this.body.on(VerletBody.EVENT_COLLIDE, this.onCollide);

        app.loop.add(this.onUpdate);
    }

    onCollide = (otherBody) => {
        if (otherBody?.player) {
            app.eventEmitter.emit(app.data.EVENTS.PLAYER_TAKE_DAMAGE, { amount: this.damage, source: 'arrow' });
            this.destroy();
            return;
        }
        if (otherBody?.isWall) {
            this.destroy();
            return;
        }
    };


     onUpdate = () => {
        let dt = 1 / 40;
        this.timeAliveSeconds += dt;

        if (!this.direction || this.timeAliveSeconds >= this.maxLifetimeSeconds) {
            this.destroy();
            return;
        }

        let step = this.speed * dt;
        this.sprite.position.x += this.direction.x * step;
        this.sprite.position.y += this.direction.y * step;
        this.sprite.position.z += this.direction.z * step;

        // ---- ROTATE SPRITE TOWARDS FLIGHT DIRECTION  ----
        let camera = app.three.camera;
        if (camera && this.sprite?.material) {
            // project current and a tiny step-forward point
            this.screenTmpFrom.copy(this.sprite.position).project(camera);
            this.screenTmpTo.copy(this.sprite.position)
                .addScaledVector(this.direction, 0.01)  
                .project(camera);

            let dx = this.screenTmpTo.x - this.screenTmpFrom.x;
            let dy = this.screenTmpTo.y - this.screenTmpFrom.y;
            let angle = -Math.atan2(dx, dy);         
            this.sprite.material.rotation = angle;
            this.sprite.rotation.z = angle;
        }
    };


    destroy() {
        app.loop.remove(this.onUpdate);
        if (this.body) { app.phys.removeBody(this.body); this.body = null; }
        if (this.sprite?.parent) this.sprite.removeFromParent();
        this.root = null;
        this.sprite = null;
        this.direction = null;
        this.targetPoint = null;
    }
}

// gameManagers/EnemyAttackController.mjs
import EnemyProjectile from '../objects/EnemyProjectile.mjs';

export default class EnemyAttackController {
    scene;

    constructor(scene) {
        this.scene = scene;
        app.eventEmitter.on('enemy_try_shoot', this.onEnemyTryShoot);
    }

    onEnemyTryShoot = ({ enemy, target }) => {
        if (!enemy || !target || !this.scene?.worldRoot) return;

        let startPosition = enemy.model.position.clone();
        startPosition.y += 1.2;

        let targetSnapshot = target.position.clone();

        new EnemyProjectile(this.scene.worldRoot, startPosition, targetSnapshot, {
            damage: 60,
            speed: 12,
            hitRadius: 0.1,
            textureKey: 'arrow_enemy'
        });
    };

    destroy() {
        app.eventEmitter.off('enemy_try_shoot', this.onEnemyTryShoot);
    }
}

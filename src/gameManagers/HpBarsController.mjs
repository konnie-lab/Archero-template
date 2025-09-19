// ui/UnitHpBars.mjs

import { UnitHpBar } from "../ui/UnitHpBar.mjs";


export default class HpBarsController {
    layer;
    scene;

    heroBar = null;
    enemyBars = new Map(); // EnemyBase -> UnitHpBar

    heroOffsetPx = { x: 0, y: -70 };
    enemyOffsetPx = { x: 0, y: -80 };

    constructor(layer = app.overlayLayer, scene) {
        this.layer = layer;
        this.scene = scene;

        app.loop.add(this.onUpdate);
        app.resize.add(this.onResize);
    }

    createHeroBar() {
        if (this.heroBar) return;
        let bar = new UnitHpBar('hp_bar_base', 'hp_bar_hero', 'hp_bar_mask', false);
        bar.setVisible(true);
        bar._lastHpSeen = null;
        bar._lastMaxSeen = null;

        this.layer.addChild(bar.display);
        this.heroBar = bar;
    }

    getOrCreateEnemyBar(enemy) {
        let bar = this.enemyBars.get(enemy);
        if (bar) return bar;

        bar = new UnitHpBar('hp_bar_base', 'hp_bar_enemy', 'hp_bar_mask', false);
        bar.setVisible(false);
        bar._lastHpSeen = null;
        bar._lastMaxSeen = null;

        this.layer.addChild(bar.display);
        this.enemyBars.set(enemy, bar);
        return bar;
    }

    destroyEnemyBar(enemy) {
        let bar = this.enemyBars.get(enemy);
        if (!bar) return;
        bar.destroy();
        this.enemyBars.delete(enemy);
    }

    onUpdate = () => {
        // ----- HERO -----
        let heroModel = this.scene?.hero?.model;
        let heroHP = this.scene?.heroHealth?.hp | 0;
        let heroMax = this.scene?.heroHealth?.maxHp | 0;

        if (heroModel && heroMax > 0) {
            if (!this.heroBar) this.createHeroBar();

            if (this.heroBar._lastMaxSeen !== heroMax) {
                this.heroBar.setMaxHP(heroMax);
                this.heroBar._lastMaxSeen = heroMax;
            }
            if (this.heroBar._lastHpSeen !== heroHP) {
                this.heroBar.setHP(heroHP);
                this.heroBar._lastHpSeen = heroHP;
            }

            let pos = { x: 0, y: 0 };
            app.three.position3DTo2D({ object3d: heroModel, position2d: pos });
            this.heroBar.setScreenPosition(pos.x + this.heroOffsetPx.x, pos.y + this.heroOffsetPx.y);
            this.heroBar.setVisible(true);
        }

        // ----- ENEMIES -----
        let root = this.scene?.worldRoot;
        if (!root) return;

        for (let child of root.children) {
            if (child?.name !== 'Enemy') continue;
            let enemy = child.userData?.enemy;
            if (!enemy || enemy.isDead) continue;

            let bar = this.getOrCreateEnemyBar(enemy);

            let max = Math.max(1, enemy.maxHp | 0);
            let hp  = Math.max(0, enemy.hp | 0);

            if (bar._lastMaxSeen !== max) {
                bar.setMaxHP(max);
                bar._lastMaxSeen = max;
            }
            if (bar._lastHpSeen !== hp) {
                bar.setHP(hp);
                bar._lastHpSeen = hp;
                // show after first hit
                if (hp < max) bar.setVisible(true);
            }

            let pos2 = { x: 0, y: 0 };
            app.three.position3DTo2D({ object3d: enemy.model, position2d: pos2 });
            bar.setScreenPosition(pos2.x + this.enemyOffsetPx.x, pos2.y + this.enemyOffsetPx.y);
        }

        // cleanup
        for (let [enemy, bar] of this.enemyBars) {
            if (!enemy || enemy.isDead || !enemy.model?.parent) this.destroyEnemyBar(enemy);
        }
    };

    onResize = () => { /* positioning is per-frame */ };

    destroy() {
        app.loop.remove(this.onUpdate);
        app.resize.remove(this.onResize);
        if (this.heroBar) { this.heroBar.destroy(); this.heroBar = null; }
        for (let [, bar] of this.enemyBars) bar.destroy();
        this.enemyBars.clear();
    }
}

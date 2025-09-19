// ui/UnitHpBar.mjs
import { Container, BitmapText } from "pixi-7.4.2";

export class UnitHpBar {
    display;
    content;

    maxHP = 300;
    currentHP = 300;

    hpBarEmpty;
    hpBarFull;
    hpBarMask;
    hpText;

    screenX = 0;
    screenY = 0;
    visible = true;

    // anti-jitter state
    _lastHP = null;
    _lastMax = null;
    _tween = null;

    constructor(
        hpBarEmptyTexture = 'hp_bar_base',
        hpBarFullTexture = 'hp_bar_hero',   // use 'hp_bar_enemy' for enemies
        hpBarMaskTexture = 'hp_bar_mask',
        showText = false
    ) {
        this.hpBarEmptyTexture = hpBarEmptyTexture;
        this.hpBarFullTexture = hpBarFullTexture;
        this.hpBarMaskTexture = hpBarMaskTexture;
        this.showText = !!showText;

        this.display = new Container();
        this.display.eventMode = 'none';
        this.display.scale.set(0.4);

        this.content = new Container();
        this.content.eventMode = 'none';
        this.display.addChild(this.content);

        this.initHpBar();

        app.resize.add(this.onResize);
        this.onResize();
    }

    // ---------- init ----------
    initHpBar() {
        this.hpBarEmpty = app.pixi.sprite(this.hpBarEmptyTexture, { anchor: 0.5 });
        this.hpBarFull  = app.pixi.sprite(this.hpBarFullTexture,  { anchor: 0.5 });

        this.hpBarMask = app.pixi.sprite(this.hpBarMaskTexture);
        this.hpBarMask.anchor.set(0, 0.5);
        this.hpBarMask.x = -this.hpBarFull.width / 2;

        this.hpBarFull.mask = this.hpBarMask;

        this.content.addChild(this.hpBarEmpty, this.hpBarFull, this.hpBarMask);

        if (this.showText) {
            this.hpText = new BitmapText(`${this.currentHP}`, {
                fontName: "BerlinSansFBDemi-Bold",
                fontSize: 22,
                align: "center",
            });
            this.hpText.anchor.set(0.5);
            this.hpText.position.set(0, -22);
            this.content.addChild(this.hpText);
        }

        this.updateVisualState(true);
    }

    // ---------- API ----------
    setMaxHP(maxValue) {
        let value = Math.max(1, maxValue | 0);
        if (value === this.maxHP && this._lastMax === value) return;

        this.maxHP = value;
        this._lastMax = value;

        if (this.currentHP > this.maxHP) this.currentHP = this.maxHP;
        this.updateVisualState(true); // сразу, без твинa
    }

    setHP(value) {
        let clamped = Math.max(0, Math.min(this.maxHP, value | 0));
        if (clamped === this.currentHP && this._lastHP === clamped) return;

        this.currentHP = clamped;
        this._lastHP = clamped;

        this.updateVisualState();
    }

    removeHP(amount = 1) {
        this.setHP(this.currentHP - (amount | 0));
    }

    setVisible(flag) {
        this.visible = !!flag;
        this.display.visible = this.visible;
    }

    setScreenPosition(x, y) {
        // не округляем до целых — иначе видны ступеньки при движении/масштабе
        this.screenX = x;
        this.screenY = y;
        this.display.position.set(this.screenX, this.screenY);
    }

    // ---------- visuals ----------
    updateVisualState(immediate = false) {
        let ratio = this.currentHP / this.maxHP;
        let targetScale = Math.max(0, Math.min(1, ratio));

        if (immediate) {
            if (this._tween) { this._tween.kill(); this._tween = null; }
            this.hpBarMask.scale.x = targetScale;
        } else {
            if (this._tween) this._tween.kill();
            this._tween = gsap.to(this.hpBarMask.scale, {
                x: targetScale,
                duration: 0.22,
                ease: 'power1.out',
                overwrite: true,
                onComplete: () => { this._tween = null; }
            });
        }

        if (this.hpText) this.hpText.text = `${this.currentHP}`;
    }

    destroy() {
        app.resize.remove(this.onResize);
        if (this._tween) { this._tween.kill(); this._tween = null; }
        gsap.killTweensOf(this.hpBarMask?.scale);
        this.display.destroy({ children: true });
    }

    onResize = () => { /* layout is driven by world→screen per-frame */ };
}

// gameManagers/HeroHealthController.mjs
export default class HeroHealthController {
  hero;
  maxHp = app.data.GAME_CONFIG.hero.hp ?? 300;
  hp = app.data.GAME_CONFIG.hero.hp ?? 300;

  isInvulnerable = false;
  invulnerableSeconds = 0.2;
  invulnerableTimer = 0;

  contactCooldownSeconds = 0.45;
  contactTimer = 0;

  hasDied = false; // ← добавили

  constructor(hero) {
    this.hero = hero;
    this.hp = this.maxHp;
    app.loop.add(this.onUpdate);

    app.eventEmitter.on(app.data.EVENTS.PLAYER_TAKE_DAMAGE, this.onTakeDamage);
  }

  onTakeDamage = ({ amount = 0, source = null } = {}) => {
    if (this.hasDied) return;             // ← ранний выход, если уже мертв
    if (this.isInvulnerable) return;

    this.hp = Math.max(0, this.hp - (amount | 0));
    console.log('[HERO HP]', this.hp, '(-' + (amount | 0) + ')', 'source:', source);

    this.isInvulnerable = true;
    this.invulnerableTimer = this.invulnerableSeconds;

    app.eventEmitter.emit(app.data.EVENTS.SHOW_DAMAGE_NUMBER, {
      worldObject: this.hero?.model,
      amount: amount | 0,
      color: 0xffffff
    });

    if (this.hp <= 0 && !this.hasDied) {  // ← единичный переход в смерть
      this.hasDied = true;
      app.eventEmitter.emit(app.data.EVENTS.PLAYER_DIED);
    }
  };

  tryContactDamage(amount = 50) {
    if (this.hasDied) return;             // ← не бьём труп
    if (this.isInvulnerable) return;
    if (this.contactTimer > 0) return;

    app.eventEmitter.emit(app.data.EVENTS.PLAYER_TAKE_DAMAGE, { amount, source: 'contact' });
    this.contactTimer = this.contactCooldownSeconds;
  }

  onUpdate = () => {
    let dt = 1 / 40;
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
    if (this.contactTimer > 0) {
      this.contactTimer -= dt;
    }
  };

  destroy() {
    app.loop.remove(this.onUpdate);
    app.eventEmitter.off(app.data.EVENTS.PLAYER_TAKE_DAMAGE, this.onTakeDamage);
  }
}

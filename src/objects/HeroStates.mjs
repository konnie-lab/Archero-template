import { State, Predicate } from "../modules/managers/StateManager.mjs";

export class IdleHeroState extends State {
    hero;
    idleName;

    constructor(hero, idleName = "Idle") {
        super();
        this.hero = hero;
        this.idleName = idleName;
        this.addPredicate(new StartRunPredicate(hero));
    }

    enter() {
        if (this.hero.anim) this.hero.anim.set(this.idleName, 0, 0.2);
    }

    update(params) { }
    exit() { }
}

export class RunHeroState extends State {
    hero;
    runName;

    constructor(hero, runName = "Run") {
        super();
        this.hero = hero;
        this.runName = runName;
        this.addPredicate(new StopRunPredicate(hero));
    }

    enter() {
        if (this.hero.anim) this.hero.anim.set(this.runName, 0, 0.2);
    }

    update(params) {

        let dt = (params && params.dt) || 1 / 40;
        if (this.hero.speed > 0) {
            let yaw = this.hero.model.rotation.y;
            let step = this.hero.speed * dt;
            this.hero.model.position.x += Math.sin(yaw) * step;
            this.hero.model.position.z += Math.cos(yaw) * step;
        }
    }

    exit() { }
}
/* ───────── Predicates (conditions) ───────── */

export class StartRunPredicate extends Predicate {
    hero;

    constructor(hero) {
        super();
        this.hero = hero;
    }

    check() {
        if (this.hero.speed > 0) {
            this.stateMachine.set(RunHeroState);
        }
    }
}

export class StopRunPredicate extends Predicate {
    hero;

    constructor(hero) {
        super();
        this.hero = hero;
    }

    check() {
        if (this.hero.speed <= 0) {
            this.stateMachine.set(IdleHeroState);
        }
    }
}

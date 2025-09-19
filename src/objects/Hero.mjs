import { Group, Mesh } from "three-161";
import THREEAnimationManager from "../modules/managers/ThreeAnimationManager.mjs";
import { CircleShape } from "../modules/physics/VerletPhysics.mjs";
import { StateManager } from "../modules/managers/StateManager.mjs";
import { IdleHeroState, RunHeroState } from "./HeroStates.mjs";

export default class Hero {
    model;
    anim;
    body;
    fsm;
    speed = 0;
    maxSpeed = app.data.GAME_CONFIG.hero.moveSpeed ?? 6;
    direction = 0;

    constructor() {
        this.initModel();
        this.initPhysBody();
        this.initFSM();
        app.loop.add(this.onUpdate);
    }

    initModel() {
        this.model = new Group();
        this.model.name = "Archer";

        let heroObject = app.three.getObject(this.model.name);
        heroObject.scale.multiplyScalar(1);
        heroObject.getObjectByName('ArcherBody').castShadow = true;
        heroObject.getObjectByName('ArcherBody').material = app.three.materials.archer;
        console.log (heroObject.getObjectByName('ArcherBody'))
        this.model.add(heroObject);

        if (app.three.materials?.archer) {
            heroObject.traverse((node) => {
                if (node instanceof Mesh) {
                    node.material = app.three.materials.archer;
                }
            });
        }

        let animations = (app.assets.models.archer && app.assets.models.archer.animations) ||  [];

        let animationSpeed = 1 / 30;
        this.anim = new THREEAnimationManager(heroObject, animations, animationSpeed);
        this.anim.set("Idle");

        this.model.position.set(0, 0, 8);
    }

    initPhysBody() {
        let physShape = new CircleShape(0.6);
        this.body = app.phys.addModel(this.model, physShape);
        this.body.player = this;
    }

    initFSM() {
        this.fsm = new StateManager();

        let idle = new IdleHeroState(this, "Idle");
        let run  = new RunHeroState(this, "Run");

        this.fsm.add(idle, run);
        this.fsm.set(IdleHeroState);
    }

    setSpeed(value) {
        this.speed = Math.max(0, value);
    }

    setDirection(radians) {
        this.direction = radians;
        this.model.rotation.y = radians;
    }

    setPosition(x, y, z) {
        this.model.position.set(x, y, z);
    }

    onUpdate = () => {
        this.fsm.update();
    };
}

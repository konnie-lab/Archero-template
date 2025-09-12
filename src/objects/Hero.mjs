import { Group, Mesh } from "three-161";
import { StateManager } from "../modules/managers/StateManager.mjs";
import THREEAnimationManager from "../modules/managers/ThreeAnimationManager.mjs";
import { IdleHeroState, RunHeroState } from "./HeroStates.mjs";
import { CircleShape } from "../modules/physics/VerletPhysics.mjs";

export default class Hero {
    model;
    anim;
    body;
    fsm;

    speed = 0;
    maxSpeed = 6;
    direction = 0;

    constructor() {
        this.initModel();
        this.initPhysBody();
        this.initFSM();
        app.loop.add(this.onUpdate);
    }

    initModel() {
        this.model = new Group();
        this.model.name = "Jane";

        let heroObject = app.three.getObject(this.model.name);
        heroObject.scale.multiplyScalar(1);
        heroObject.getObjectByName('JaneBody').castShadow = true;
        heroObject.getObjectByName('JaneBody').material = app.three.materials.jane;
        this.model.add(heroObject);

        if (app.three.materials?.jane) {
            heroObject.traverse((node) => {
                if (node instanceof Mesh) node.material = app.three.materials.jane;
            });
        }

        let animations =
            (app.assets.models.jane && app.assets.models.jane.animations) ||
            (app.assets.models.Jane && app.assets.models.Jane.animations) ||
            (app.assets.models.hero && app.assets.models.hero.animations) ||
            [];

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
        let run = new RunHeroState(this, "Run");
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
        this.model.position.set(x, y, z)
    }

    onUpdate = () => {
        this.fsm.update();
    }



}

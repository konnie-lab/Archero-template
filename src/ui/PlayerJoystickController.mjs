import { Container } from "pixi-7.4.2";
import { Vector3 } from "three-161";

export default class PlayerJoystickController {
    player;
    cameraRef;
    display;
    joystickBar;

    limit = 0;
    mouse = { x: 0, y: 0, isDown: false };

    // "dynamic" | "home"
    mode = "dynamic";

    home = { x: 0, y: 0 };

    constructor(player, cameraRef = null, autoStart = true, mode = "dynamic") {
        this.player = player;
        this.cameraRef = cameraRef;
        this.mode = mode;
        this.initJoystick();
        this.display.on("added", this.#onAddedToParent);
        this.setHomeFromAppSize();
        if (autoStart) this.start();
    }

    setCamera(cameraRef) {          
        this.cameraRef = cameraRef;
    }


    initJoystick() {
        this.display = new Container();
        this.display.visible = (this.mode === "home");

        let joystickBg = app.pixi.sprite("joystickBack2", { anchor: 0.5 });
        let joystickBar = app.pixi.sprite("joystickBar2", { anchor: 0.5 });

        this.limit = (joystickBg.width - joystickBar.width) / 2;

        this.display.addChild(joystickBg, joystickBar);
        this.joystickBar = joystickBar;
    }

    setMode(mode) {
        this.mode = mode === "home" ? "home" : "dynamic";
        this.setHomeFromAppSize();

        if (this.mode === "home") {
            this.display.visible = true;
            this.display.position.set(this.home.x, this.home.y);
        } else {
            this.display.visible = false;
        }
    }

    #onAddedToParent = () => {
        this.setHomeFromAppSize();
        if (this.mode === "home" && !this.mouse.isDown) {
            this.display.visible = true;
            this.display.position.set(this.home.x, this.home.y);
        }
    };

    setHomeFromAppSize() {
        this.home.x = app.width / 2;
        this.home.y = app.height - 140;
    }

    stageDownHandler = (event) => {
        this.mouse.isDown = true;
        this.display.visible = true;

        this.display.parent.toLocal(event.global, null, this.mouse);

        this.joystickBar.x = 0;
        this.joystickBar.y = 0;

        this.display.x = this.mouse.x;
        this.display.y = this.mouse.y;
    };

    stageMoveHandler = (event) => {
        if (!this.mouse.isDown) return;

        this.display.parent.toLocal(event.global, null, this.mouse);

        let offsetX = this.mouse.x - this.display.x;
        let offsetY = this.mouse.y - this.display.y;

        let angle = Math.atan2(offsetY, offsetX);
        let rawDistance = Math.hypot(offsetX, offsetY);

        let radius = Math.min(rawDistance, this.limit);

        this.joystickBar.x = radius * Math.cos(angle);
        this.joystickBar.y = radius * Math.sin(angle);

        if (radius < 1e-6) {
            this.player.speed = 0;
            return;
        }

        let unitDirX = Math.cos(angle); // right +
        let unitDirY = Math.sin(angle); // down  +

        let { forward, right } = this.getCameraBasis();

        let worldDirX = right.x * unitDirX + forward.x * (-unitDirY);
        let worldDirZ = right.z * unitDirX + forward.z * (-unitDirY);

        this.player.model.rotation.y = Math.atan2(worldDirX, worldDirZ);
        this.player.speed = this.player.maxSpeed * (radius / this.limit);
    };




    stageUpHandler = () => {
        this.player.speed = 0;
        this.mouse.isDown = false;
        this.joystickBar.x = 0;
        this.joystickBar.y = 0;

        if (this.mode === "home") {
            this.setHomeFromAppSize();
            this.display.visible = true;
            this.display.position.set(this.home.x, this.home.y);
        } else {
            this.display.visible = false;
        }
    };

    onResize = () => {
        this.setHomeFromAppSize();
        if (this.mode === "home" && !this.mouse.isDown) {
            this.display.position.set(this.home.x, this.home.y);
            this.display.visible = true;
        }
    };

    start() {
        app.pixi.stage.on("pointerdown", this.stageDownHandler);
        app.pixi.stage.on("pointermove", this.stageMoveHandler);
        app.pixi.stage.on("pointerup", this.stageUpHandler);
        app.pixi.stage.on("pointerupoutside", this.stageUpHandler);

        window.addEventListener("pointercancel", this.stageUpHandler);
        app.eventEmitter.on("application_pause", this.stageUpHandler);

        app.resize.add(this.onResize);

        this.#onAddedToParent();
    }

    stop() {
        app.pixi.stage.off("pointerdown", this.stageDownHandler);
        app.pixi.stage.off("pointermove", this.stageMoveHandler);
        app.pixi.stage.off("pointerup", this.stageUpHandler);
        app.pixi.stage.off("pointerupoutside", this.stageUpHandler);

        window.removeEventListener("pointercancel", this.stageUpHandler);
        app.eventEmitter.off("application_pause", this.stageUpHandler);

        app.resize.remove(this.onResize);

        this.stageUpHandler();
    }


    getCameraBasis() {
        let forward = new Vector3();

        if (this.cameraRef) {
            this.cameraRef.getWorldDirection(forward);
        } else {
            forward.set(0, 0, -1);
        }

        forward.y = 0;

        if (forward.lengthSq() < 1e-8) forward.set(0, 0, -1);

        forward.normalize();

        let upVector = new Vector3(0, 1, 0);
        let right = new Vector3().copy(forward).cross(upVector).normalize();
        if (!Number.isFinite(right.x) || right.lengthSq() < 1e-8) right.set(1, 0, 0);

        return { forward, right };
    }
}

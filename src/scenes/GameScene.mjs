// GameScene.mjs
import { Container } from 'pixi-7.4.2';
import {
    Group,
    Color,
    AmbientLight,
    DirectionalLight,
    MeshPhongMaterial,
    MeshBasicMaterial,
    MeshLambertMaterial,
} from 'three-161';

import { Background } from '../objects/Background.mjs';
import Hero from '../objects/Hero.mjs';
import PlayerJoystickController from '../ui/PlayerJoystickController.mjs';
import Walls from '../objects/Walls.mjs';
import { RATIO_NAMES } from '../modules/managers/ResizeManager.mjs';
import OrthoCameraRig from '../ui/OrthoCameraRig.mjs';
import { OrbitControls } from 'three-161/examples/jsm/controls/OrbitControls.js';
import DamageNumbersFX from '../fx/DamageNumbersFX.mjs';

export default class GameScene {
    display;
    worldRoot;

    background;
    hero;

    playerJoystick;

    constructor() {
        this.display = new Container();
        app.three.scene.background = new Color(0xFFFFFF);

        this.initLights();
        this.initMaterials();

        this.worldRoot = new Group();
        this.worldRoot.name = 'WorldRoot';
        app.three.scene.add(this.worldRoot);

        this.init3DObjects();
        this.init2DObjects();
        this.initFXhelpers();
        this.initCharacters();

        this.initOrthoCamera();
        this.initJoystickController();

        // this.initOrbitControls()

        app.resize.add(this.onResize);
        app.loop.add(this.onUpdate);

        this.onResize();
        this.onUpdate();
    }

    /*──────────────── CAMERA (fixed ortho) ────────────────*/
    initOrthoCamera() {
        this.orthoCameraRig = new OrthoCameraRig({
            worldRoot: this.worldRoot,
            getTarget: () => this.hero?.model,
        });

        this.orthoCameraRig.setFollowAxes({ x: false, y: false, z: true });
        this.orthoCameraRig.lockAxisX(true);
        this.orthoCameraRig.lockAxisY(true);
        this.orthoCameraRig.lockAxisZ(false);

        this.orthoCameraRig.setAnchorZ(7.5);        // world offset 
        this.orthoCameraRig.setClamp('z', 0.0, 4.5); // clamp to fit the textures
        this.orthoCameraRig.setLerp({ z: 0 });       // 0 = instant
    }

    /*──────────────── LIGHTS / MATERIALS / OBJECTS ───────*/
    initLights() {
        let lightAmbient = new AmbientLight(0xffffff, 1.2);
        app.three.scene.add(lightAmbient);

        let lightDirectional = new DirectionalLight(0xffffff, 3.1);
        lightDirectional.position.set(-5, 35, -2);
        lightDirectional.castShadow = true;

        lightDirectional.shadow.camera.left = -14;
        lightDirectional.shadow.camera.right = 14;
        lightDirectional.shadow.camera.top = 14;
        lightDirectional.shadow.camera.bottom = -14;
        lightDirectional.shadow.radius = 2;
        lightDirectional.shadow.mapSize.width = 1024;
        lightDirectional.shadow.mapSize.height = 1024;

        app.three.scene.add(lightDirectional);
    }

    initOrbitControls() {
        this.controls = new OrbitControls(app.three.camera, app.pixi.app.view);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.update();
    }

    initMaterials() {
        app.three.materials = {
            floor: new MeshPhongMaterial({ map: app.three.getMap('wood', true) }),
            jane: new MeshBasicMaterial({ map: app.three.getMap('janeTexture') }),
            hen: new MeshLambertMaterial({map: app.three.getMap('henTexture') }),
        };
    }

    init3DObjects() {
        this.background = new Background('background');
        this.background.backgroundMesh.position.set(0, 0, 0);
        this.background.backgroundMesh.rotateX(-Math.PI / 2);
        this.worldRoot.add(this.background.backgroundMesh);

        // Borders:
        let bounds = {
            minX: -5.5,  // left border
            maxX: 5.5,   // right border
            minZ: -8.0,  // top border
            maxZ: 12.3,  // bottom border
        };

        this.walls = new Walls(this.worldRoot, {
            bounds,
            show: true,
            color: 0xff8800,
            alpha: 0.25
        });

        this.walls.setVisible(false);
    }

    init2DObjects() { }

    initFXhelpers() { 
        this.damageFX = new DamageNumbersFX(app.fxLayer);
    }

    initCharacters() {
        this.hero = new Hero();

        this.hero.setPosition(0, 0, 6)
        this.worldRoot.add(this.hero.model);
    }

    /*──────────────── CONTROLS ───────────────────────────*/
    initJoystickController() {
        this.playerJoystick = new PlayerJoystickController(this.hero, app.three.camera, true, 'home');
        this.display.addChild(this.playerJoystick.display);
    }

    /*──────────────── RESIZE / UPDATE / DESTROY ──────────*/
    onResize = () => {


        this.background.backgroundMesh.position.set(0, 0, 0);
        this.background.backgroundMesh.scale.set(1, 1, 1);

        let mode = app.resize.ratioLess('SM')
            ? 'TABLET'
            : (app.resize.ratioName === RATIO_NAMES.XLG ? 'TALL' : 'DEFAULT');

        switch (mode) {
            case 'TABLET': {
                // 4:3, 16:10, etc.
                this.orthoCameraRig.setZoom(52)
                this.orthoCameraRig.setClamp('z', -1, 3.5);
                this.orthoCameraRig.setAnchorZ(4.5);
                this.playerJoystick.display.scale.set(0.7)
                break;
            }

            case 'TALL': {
                // Very tall phones (e.g., iPhone 12/14 Pro Max)
                this.orthoCameraRig.setZoom(55)
                this.orthoCameraRig.setAnchorZ(7.5);
                this.orthoCameraRig.setClamp('z', 0, 4.5);
                this.playerJoystick.display.scale.set(0.9)

                break;
            }

            default: {
                // Default phones / desktop
                this.orthoCameraRig.setZoom(53)
                this.orthoCameraRig.setAnchorZ(8);
                this.orthoCameraRig.setClamp('z', 0, 5);
                this.playerJoystick.display.scale.set(0.9)

                break;
            }
        }
    };

    onUpdate = () => {

    };

    destroy() {
        app.resize.remove(this.onResize);
        app.loop.remove(this.onUpdate);
    }
}

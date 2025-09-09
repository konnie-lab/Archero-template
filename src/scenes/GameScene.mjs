import { Container } from 'pixi-7.4.2';
import { OrbitControls } from 'three-161/examples/jsm/controls/OrbitControls.js';
import {
    AmbientLight,
    AxesHelper,
    Color,
    DirectionalLight,
    Mesh,
    MeshPhongMaterial,
    SphereGeometry,
    Vector3,
} from 'three-161';

import { Background } from '../objects/Background.mjs';

export default class GameScene {

    constructor() {

        this.display = new Container();

        app.three.scene.background = new Color(app.data.COLORS.background);

        this.initCamera();
        // this.initOrbitControls();
        // this.initAxisHelper();
        this.initLights();
        this.initMaterials();
        this.init3DObjects();
        this.init2DObjects();
        this.initFXhelpers();
        this.initCharacters();

        app.resize.add(this.onResize);
        app.loop.add(this.onUpdate);

        this.onResize();
        this.onUpdate();
    }


    initCamera() {
        this.camera = app.three.camera;
        this.camera.userData.lookAtY = 0;
        this.updateCameraToGamePos();
    }

    getCameraGamePosition() {
        let offsetY = this.ball ? -this.ball.currentLevel * this.ball.drumStep : 0;
        let baseY = 4 + offsetY;

        return app.isPortrait
            ? new Vector3(0, baseY, 10)              // portrait
            : new Vector3(0, baseY - 1, 7);          // landscape
    }

    updateCameraToGamePos() {
        let position = this.getCameraGamePosition();
        this.camera.position.copy(position);
        this.camera.lookAt(0, 0, 0);
    }

    initOrbitControls() {
        this.controls = new OrbitControls(app.three.camera, app.pixi.app.view);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.update();
    }

    initAxisHelper() {
        this.axisHelper = new AxesHelper(20)
        this.axisHelper.position.set(0, 0, 0);
        this.axisHelper.visible = true;
        app.three.scene.add(this.axisHelper);
    }

    initLights() {

        let lightAmbient = new AmbientLight(0xffffff, 1.2);
        app.three.scene.add(lightAmbient);

        let lightDirectional = new DirectionalLight(0xffffff, 3.1);
        lightDirectional.position.set(-10, 15, 10);
        lightDirectional.castShadow = true;

        lightDirectional.shadow.camera.left = -14;
        lightDirectional.shadow.camera.right = 14;
        lightDirectional.shadow.camera.top = 14;
        lightDirectional.shadow.camera.bottom = -14;
        lightDirectional.shadow.radius = 2;
        lightDirectional.shadow.mapSize.width = 1024;
        lightDirectional.shadow.mapSize.height = 1024;

        let sphereMaterial = new MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 100,
            transparent: true,
            opacity: 0.8,
        });

        let lightSphere = new Mesh(new SphereGeometry(0.3, 32, 32), sphereMaterial);
        lightDirectional.add(lightSphere);

        let glowSprite = app.three.sprite('spark', { scale: 0.05, depthWrite: false, });
        lightDirectional.add(glowSprite);

        app.three.scene.add(lightDirectional);


    }

    initMaterials() {
        // true - false = flipY 
        app.three.materials = {
            floor : new MeshPhongMaterial({ map: app.three.getMap('wood', true) }),
        };
    }

    init3DObjects() {
        this.background = new Background('background');
        this.background.backgroundMesh.position.set(0, -8, -10);
        this.background.backgroundMesh.rotateX(-0.2);
        app.three.scene.add(this.background.backgroundMesh);
    }

    init2DObjects() {

    }

    initCharacters() {

    }

    initFXhelpers() {

    }

    onResize = () => {

        if (app.isPortrait) {
            this.background.backgroundMesh.position.set(0, -8, -8);
            this.background.backgroundMesh.scale.set(1, 1, 1);
        } else {
            this.background.backgroundMesh.position.set(0, -8, -7);
            this.background.backgroundMesh.scale.set(2, 2, 2);
        }

        this.updateCameraToGamePos();
    };

    onUpdate = () => {
        this.camera.lookAt(0, 0, 0)
    };

    destroy() {
        app.resize.remove(this.onResize);
        app.loop.remove(this.onUpdate);
        this.controls?.dispose?.();
    }
}

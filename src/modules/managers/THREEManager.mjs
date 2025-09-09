import {
    Box3,
    Vector3,
    Scene,
    Color,
    PerspectiveCamera,
    WebGLRenderer,
    PCFShadowMap,
    SRGBColorSpace,
    Texture,
    NearestFilter,
    RepeatWrapping,
    Raycaster,
    Object3D,
    Camera,
    LinearFilter,
    SpriteMaterial,
    Sprite,
    CubeTexture,
} from 'three-161';

export default class THREEManager {
    /** @type {Scene} */
    scene;

    /** @type {WebGLRenderer} */
    renderer;

    /** @type {Camera} */
    camera;

    /** @type {Raycaster} */
    raycaster;

    /** @type {Object} */
    materials = {};

    #maps = {};
    #intersects = [];
    #mouse = { x: 0, y: 0 };
    #vector3 = new Vector3();
    #box3 = new Box3();
    #bufferVector3 = new Vector3();

    constructor() {
        this.scene = new Scene();
        this.scene.name = 'MainScene';
        this.scene.background = new Color(0x010101);

        this.camera = new PerspectiveCamera();

        this.renderer = new WebGLRenderer({
            antialias: true,
            powerPreference: 'low-power'
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFShadowMap;
        this.renderer.outputColorSpace = SRGBColorSpace;

        let element = document.getElementById('canvas3d');
        element.append(this.renderer.domElement);

        this.raycaster = new Raycaster();
        this.raycaster.layers.set(1);

        app.loop.add(this.#onUpdate.bind(this));
        app.resize.add(this.#onResize.bind(this));
    }

    #onUpdate() {
        this.renderer.render(this.scene, this.camera);
    }

    #onResize() {
        let pixelRatio = app.settings.pixelRatio;

        this.camera.aspect = app.width / app.height;
        this.camera.fov = app.width > app.height ? app.settings.camera.fov.landscape : app.settings.camera.fov.portraite;
        this.camera.updateProjectionMatrix();

        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(app.width, app.height);

        this.renderer.domElement.style.height = app.pixi.app.view.style.height;
        this.renderer.domElement.style.width = app.pixi.app.view.style.width;
        this.renderer.domElement.style.left = app.pixi.app.view.style.left;
        this.renderer.domElement.style.top = app.pixi.app.view.style.top;
    }

    /**
     * Get Texture map
     * @param {String} imageName 
     * @param {Boolean} flipY 
     * @returns {Texture}
     */
    getMap(imageName, flipY = false) {
        let map = this.#maps[imageName];
        if (map) return map;

        let image = app.assets.images[imageName];
        if (image != undefined) {
            let map = new Texture(image);
            map.magFilter = LinearFilter;
            map.wrapS = RepeatWrapping;
            map.wrapT = RepeatWrapping;
            map.flipY = flipY;
            map.colorSpace = SRGBColorSpace;
            map.needsUpdate = true;
            this.#maps[imageName] = map;

            return map;
        }
    }

    /**
     * Get scene from assets
     * @param {String} name 
     * @returns {Object3D}
     */
    getScene(name) {
        return app.assets.models[name].scene;
    }

    /**
     * Get 3d object from assets
     * @param {String} name 
     * @returns {Object3D}
     */
    getObject(name) {
        for (let modelName in app.assets.models) {
            let object = this.getScene(modelName).getObjectByName(name);
            if (object) return object;
        }
    }

    /**
     * Create Sprite3D
     * @param {String} imageNameOrMap 
     * @param {Object} options 
     * @param {Object} options.position
     * @param {Number} options.centerX 
     * @param {Number} options.centerY 
     * @param {Number} options.scale 
     * @param {Boolean} options.depthWrite 
     * @returns 
     */
    sprite(imageNameOrMap, { position, centerX = 0.5, centerY = 0.5, depthWrite = true, scale = 1 } = {}) {
        let map = imageNameOrMap instanceof Texture ? imageNameOrMap : this.getMap(imageNameOrMap, true);
        let spriteMaterial = new SpriteMaterial({
            map,
            depthWrite
        });

        let sprite = new Sprite(spriteMaterial);
        sprite.scale.set(map.image.width, map.image.height);
        sprite.scale.multiplyScalar(scale);
        sprite.center.x = centerX;
        sprite.center.y = centerY;

        if (position !== undefined) sprite.position.copy(position);

        return sprite;
    }

    /**
     * Set 2d object position to 3d object position
     * @param {Object} options 
     * @param {Camera} options.camera
     * @param {Object} options.position2d
     * @param {Vector3} options.position3d
     * @param {Number} options.distanceZ
     */
    position2DTo3D({ camera = this.camera, position2d, position3d, distanceZ = 0 }) {
        let projectX = (position2d.x * app.scale / window.innerWidth) * 2 - 1;
        let projectY = -(position2d.y * app.scale / window.innerHeight) * 2 + 1;

        this.#bufferVector3.set(projectX, projectY, 1);
        this.#bufferVector3.unproject(camera);
        this.#bufferVector3.sub(camera.position).normalize();

        let distance = -camera.position.z + distanceZ;

        position3d.copy(camera.position).add(this.#bufferVector3.multiplyScalar(distance));
    }

    /**
     * Set 3d object position to 2d object position
     * @param {Object} options 
     * @param {Camera} options.camera
     * @param {Object3D} options.object3d
     * @param {Object} options.position2d
     */
    position3DTo2D({ camera = this.camera, object3d, position2d }) {
        object3d.updateMatrixWorld();
        this.#bufferVector3.setFromMatrixPosition(object3d.matrixWorld);
        this.#bufferVector3.project(camera);

        let widthHalf = 0.5 * window.innerWidth;
        let heightHalf = 0.5 * window.innerHeight;

        position2d.x = (this.#bufferVector3.x * widthHalf) + widthHalf;
        position2d.y = -(this.#bufferVector3.y * heightHalf) + heightHalf;

        let scaleX = window.innerWidth / app.width;

        position2d.x /= scaleX;
        position2d.y /= scaleX;
    }

    getIntersects(point, model, recursive = true) {
        this.#mouse.x = (point.x / window.innerWidth) * 2 - 1;
        this.#mouse.y = -(point.y / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.#mouse, this.camera);
        this.#intersects.length = 0;

        this.raycaster.intersectObject(model, recursive, this.#intersects);

        return this.#intersects;
    }

    fitCameraToObject({ camera = this.camera, object, size, center, margin = 1.0 }) {
        this.#box3 = new THREE.Box3().setFromObject(object);
        this.#vector3.set(0, 0, 0);
        size = size || this.#box3.getSize(this.#vector3);

        let maxSize = Math.max(size.x, size.y);
        let fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
        let fitWidthDistance = fitHeightDistance / camera.aspect;
        let distance = margin * Math.max(fitHeightDistance, fitWidthDistance);

        center = center ? this.#vector3.copy(center) : this.#box3.getCenter(this.#vector3);
        let direction = center.clone().sub(camera.position).normalize().multiplyScalar(distance);

        let goalCameraPos = center.sub(direction);
        camera.position.copy(goalCameraPos);
    }

}
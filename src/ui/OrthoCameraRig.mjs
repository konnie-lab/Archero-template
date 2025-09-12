import { OrthographicCamera } from 'three-161';
import { RATIO_NAMES } from '../modules/managers/ResizeManager.mjs';

export default class OrthoCameraRig {
    camera;
    worldRoot;
    getTarget;

    // follow toggles (per-axis)
    followX = false;
    followY = false;
    followZ = true;

    // axis locks (worldRoot will be forced to 0 on locked axis)
    lockX = true;
    lockY = true;
    lockZ = false;

    // per-axis lerp (0 = instant)
    lerpX = 0;
    lerpY = 0;
    lerpZ = 0;

    // per-axis anchors (target screen anchor in world coords)
    anchorX = 0;
    anchorY = 0;
    anchorZ = 6;

    // per-axis clamps (min/max or null = no clamp)
    clampX = null; // {min, max} | null
    clampY = null;
    clampZ = { min: 0, max: 3 };

    mode = 'DEFAULT';

    constructor({
        worldRoot,
        getTarget,
        cameraPos = { x: 0, y: 500, z: 500 },
        near = 1,
        far = 2000,
    }) {
        this.worldRoot = worldRoot;
        this.getTarget = getTarget;

        this.camera = new OrthographicCamera(
            -app.width / 2, app.width / 2,
             app.height / 2, -app.height / 2,
            near, far
        );
        this.camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
        this.camera.lookAt(0, 0, 0);
        app.three.camera = this.camera;

        app.resize.add(this.handleResize);
        app.loop.add(this.update);

        this.handleResize();
    }

    /*────────────── Public API ─────────────*/
    setFollowAxes({ x, y, z }) {
        if (x !== undefined) this.followX = !!x;
        if (y !== undefined) this.followY = !!y;
        if (z !== undefined) this.followZ = !!z;
    }

    lockAxisX(value) { this.lockX = !!value; }
    lockAxisY(value) { this.lockY = !!value; }
    lockAxisZ(value) { this.lockZ = !!value; }

    setClamp(axis, min, max) {
        let pack = { min, max };
        if (axis === 'x') this.clampX = pack;
        if (axis === 'y') this.clampY = pack;
        if (axis === 'z') this.clampZ = pack;
    }
    clearClamp(axis) {
        if (axis === 'x') this.clampX = null;
        if (axis === 'y') this.clampY = null;
        if (axis === 'z') this.clampZ = null;
    }

    setAnchorX(value) { this.anchorX = value; }
    setAnchorY(value) { this.anchorY = value; }
    setAnchorZ(value) { this.anchorZ = value; }

    setLerp({ x, y, z }) {
        if (x !== undefined) this.lerpX = Math.max(0, Math.min(1, x));
        if (y !== undefined) this.lerpY = Math.max(0, Math.min(1, y));
        if (z !== undefined) this.lerpZ = Math.max(0, Math.min(1, z));
    }

    setZoom(zoomValue) {
        this.camera.zoom = zoomValue;
        this.camera.updateProjectionMatrix();
    }

    applyPreset(mode) {
        this.mode = mode;
        // zoom only; clamps/locks/follow задаёшь отдельно
        switch (mode) {
            case 'TABLET': {
                this.setZoom(52);
                break;
            }
            case 'TALL': {
                this.setZoom(55);
                break;
            }
            default: {
                this.setZoom(53);
                break;
            }
        }
    }

    /*────────────── Internals ─────────────*/
    handleResize = () => {
        let cam = this.camera;
        cam.left   = -app.width  / 2;
        cam.right  =  app.width  / 2;
        cam.top    =  app.height / 2;
        cam.bottom = -app.height / 2;
        cam.updateProjectionMatrix();

        let mode = app.resize.ratioLess('SM')
            ? 'TABLET'
            : (app.resize.ratioName === RATIO_NAMES.XLG ? 'TALL' : 'DEFAULT');

        this.applyPreset(mode);
    };

    update = () => {
        let target = this.getTarget?.();
        if (!target) return;

        // X
        if (this.lockX) {
            this.worldRoot.position.x = 0;
        } else if (this.followX) {
            let targetX = -target.position.x + this.anchorX;
            this.worldRoot.position.x = this._mix(this.worldRoot.position.x, targetX, this.lerpX);
            this._applyClamp('x');
        }

        if (this.lockY) {
            this.worldRoot.position.y = 0;
        } else if (this.followY) {
            let targetY = -target.position.y + this.anchorY;
            this.worldRoot.position.y = this._mix(this.worldRoot.position.y, targetY, this.lerpY);
            this._applyClamp('y');
        }

        // Z
        if (this.lockZ) {
            this.worldRoot.position.z = 0;
        } else if (this.followZ) {
            let targetZ = -target.position.z + this.anchorZ;
            this.worldRoot.position.z = this._mix(this.worldRoot.position.z, targetZ, this.lerpZ);
            this._applyClamp('z');
        }
    };

    _applyClamp(axis) {
        let v = this.worldRoot.position[axis];
        let pack = axis === 'x' ? this.clampX : axis === 'y' ? this.clampY : this.clampZ;
        if (!pack) return;
        if (v < pack.min) v = pack.min;
        if (v > pack.max) v = pack.max;
        this.worldRoot.position[axis] = v;
    }

    _mix(current, target, lerpFactor) {
        if (!lerpFactor || lerpFactor <= 0) return target;      // instant
        if (lerpFactor >= 1) return target;                     // hard snap
        return current + (target - current) * lerpFactor;       // smooth
    }

    destroy() {
        app.resize.remove(this.handleResize);
        app.loop.remove(this.update);
    }
}

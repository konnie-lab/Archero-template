// GameCamera.mjs
import { OrthographicCamera, PerspectiveCamera, Vector3 } from 'three-161';

export default class GameCamera {
  camera;

  // ---- config/state --------
  mode = 'cinematic';          // 'cinematic' | 'orthographic'
  followEnabled = true;
  followLerp = 0.12;
  followTarget = null;

  // cinematic base positions
  cinPortrait  = new Vector3(0, 15, 5);
  cinLandscape = new Vector3(0, 15, 3);

  // orthographic placement
  orthoX = 0;
  orthoY = 500;
  orthoZ = 500;
  orthoZoom = 80;

  // ortho follow offset (to preserve side offset)
  orthoOffsetX = 0;
  orthoOffsetZ = 0;
  orthoAnchorReady = false;

  // ---- axis follow mask (true = follow, false = locked) ----
  followMask = { x: true, z: true };

  // ---- fixed forward when any axis is locked ----
  baseForward = new Vector3(0, 0, -1);

  // ---- remember last fov (не обязателен, но полезен) ----
  prevFov = null;

  constructor(options = {}) {
    const {
      mode = 'cinematic',
      follow = true,
      followLerp = 0.12,
      cinematic = {},
      orthographic = {},
      target = null,
      autoStart = true,
    } = options;

    this.mode = (mode === 'orthographic') ? 'orthographic' : 'cinematic';
    this.followEnabled = !!follow;
    this.followLerp = followLerp;
    this.followTarget = target;

    if (cinematic.portrait)  this.cinPortrait.copy(cinematic.portrait);
    if (cinematic.landscape) this.cinLandscape.copy(cinematic.landscape);

    if (orthographic.x !== undefined)    this.orthoX = orthographic.x;
    if (orthographic.y !== undefined)    this.orthoY = orthographic.y;
    if (orthographic.z !== undefined)    this.orthoZ = orthographic.z;
    if (orthographic.zoom !== undefined) this.orthoZoom = orthographic.zoom;

    this.createCamera();
    if (autoStart) this.start();
  }

  // ---------- Convenience factories ---------
  static createOrthographic(opts = {}) {
    const {
      x = 0, y = 500, z = 500, zoom = 80,
      target = null, follow = true, followLerp = 0.12, autoStart = true,
    } = opts;

    return new GameCamera({
      mode: 'orthographic',
      orthographic: { x, y, z, zoom },
      target, follow, followLerp, autoStart,
    });
  }

  static createCinematic(opts = {}) {
    const {
      portrait = new Vector3(0, 15, 5),
      landscape = new Vector3(10, 15, 3),
      target = null, follow = true, followLerp = 0.12, autoStart = true,
    } = opts;

    return new GameCamera({
      mode: 'cinematic',
      cinematic: { portrait, landscape },
      target, follow, followLerp, autoStart,
    });
  }

  // ---------- Lifecycle --------------------
  start() {
    app.resize.add(this.resize);
    app.loop.add(this.update);
    this.resize();
    this.update();
  }

  stop() {
    app.resize.remove(this.resize);
    app.loop.remove(this.update);
  }

  // ---------- Public API -------------------
  setTarget(object3D) {
    this.followTarget = object3D || null;

    if (this.mode === 'orthographic' && this.followEnabled && this.followTarget && this.camera) {
      this.orthoOffsetX = this.camera.position.x - this.followTarget.position.x;
      this.orthoOffsetZ = this.camera.position.z - this.followTarget.position.z;
      this.orthoAnchorReady = true;
    }
  }

  setFollowEnabled(enabled) {
    this.followEnabled = !!enabled;
  }

  setMode(mode) {
    const next = (mode === 'orthographic') ? 'orthographic' : 'cinematic';
    if (this.mode === next) return;
    this.mode = next;
    this.createCamera();
    this.resize();
  }

  setAxisLock(opts = {}) {
    if (opts.x !== undefined) this.followMask.x = !opts.x;
    if (opts.z !== undefined) this.followMask.z = !opts.z;

    if (this.isLocked()) {
      this.captureBaseForward();
      if (this.camera && this.camera.isPerspectiveCamera) {
        this.camera.userData = this.camera.userData || {};
        this.camera.userData.freezeFov = true;
      }
    } else {
      if (this.camera && this.camera.isPerspectiveCamera) {
        this.camera.userData = this.camera.userData || {};
        this.camera.userData.freezeFov = false;
      }
      this.captureBaseForward();
    }
  }

  clearLocks() {
    this.followMask.x = true;
    this.followMask.z = true;
    if (this.camera && this.camera.isPerspectiveCamera) {
      this.camera.userData = this.camera.userData || {};
      this.camera.userData.freezeFov = false;
    }
  }

  isLocked() {
    return !this.followMask.x || !this.followMask.z;
  }

  // ---------- Core -------------------
  createCamera() {
    if (this.mode === 'orthographic') {
      this.camera = new OrthographicCamera(-app.width / 2,  app.width / 2, app.height / 2, -app.height / 2, 1, 2000);
      this.camera.position.set(this.orthoX, this.orthoY, this.orthoZ);
      this.camera.zoom = this.orthoZoom;
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(0, 0, 0);

      if (this.followEnabled && this.followTarget) {
        this.orthoOffsetX = this.camera.position.x - this.followTarget.position.x;
        this.orthoOffsetZ = this.camera.position.z - this.followTarget.position.z;
        this.orthoAnchorReady = true;
      } else {
        this.orthoAnchorReady = false;
      }
    } else {
      this.camera = new PerspectiveCamera(35, Math.max(1e-6, app.width / app.height), 0.1, 2000);
      this.camera.position.copy(this.getCinematicBase());
      this.camera.lookAt(0, 0, 0);
    }

    app.three.camera = this.camera;

    if (this.camera.isPerspectiveCamera) {
      this.camera.userData = this.camera.userData || {};
      this.camera.userData.freezeFov = this.isLocked();
      this.prevFov = this.camera.fov;
    }

    this.captureBaseForward();
  }

  getCinematicBase() {
    return app.isPortrait ? this.cinPortrait : this.cinLandscape;
  }

  captureBaseForward() {
    if (!this.camera) return;
    this.camera.getWorldDirection(this.baseForward);
    if (this.baseForward.lengthSq() < 1e-8) this.baseForward.set(0, 0, -1);
    this.baseForward.normalize();
  }

  // ---------- Handlers -------------------
  resize = () => {
    if (!this.camera) return;

    if (this.mode === 'orthographic') {
      this.camera.left   = -app.width / 2;
      this.camera.right  =  app.width / 2;
      this.camera.top    =  app.height / 2;
      this.camera.bottom = -app.height / 2;
      this.camera.updateProjectionMatrix();
    } else {
      this.camera.aspect = Math.max(1e-6, app.width / app.height);
      this.camera.updateProjectionMatrix();

      if (!this.followEnabled || !this.followTarget) {
        this.camera.position.copy(this.getCinematicBase());
        this.camera.lookAt(0, 0, 0);
      }
    }

    if (!this.isLocked()) this.captureBaseForward();

    if (this.camera.isPerspectiveCamera) this.prevFov = this.camera.fov;
  };

  update = () => {
    if (!this.camera) return;

    const locked = this.isLocked();

    if (this.camera.isPerspectiveCamera) this.prevFov = this.camera.fov;

    if (!this.followEnabled || !this.followTarget) {
      if (locked) {
        const lookTarget = this.camera.position.clone().add(this.baseForward);
        this.camera.lookAt(lookTarget);
      } else {
        this.camera.lookAt(0, 0, 0);
      }
      return;
    }

    const targetPos = this.followTarget.position;

    if (this.mode === 'orthographic') {
      if (!this.orthoAnchorReady) {
        this.orthoOffsetX = this.camera.position.x - targetPos.x;
        this.orthoOffsetZ = this.camera.position.z - targetPos.z;
        this.orthoAnchorReady = true;
      }

      const desired = new Vector3(
        targetPos.x + this.orthoOffsetX,
        this.orthoY,
        targetPos.z + this.orthoOffsetZ
      );

      if (!this.followMask.x) desired.x = this.camera.position.x;
      if (!this.followMask.z) desired.z = this.camera.position.z;

      this.camera.position.lerp(desired, this.followLerp);

      if (locked) {
        const lookTarget = this.camera.position.clone().add(this.baseForward);
        this.camera.lookAt(lookTarget);
      } else {
        this.camera.lookAt(targetPos);
      }

    } else {
      const base = this.getCinematicBase();

      const desired = new Vector3(
        targetPos.x + base.x,
        targetPos.y + base.y,
        targetPos.z + base.z
      );

      if (!this.followMask.x) desired.x = this.camera.position.x;
      if (!this.followMask.z) desired.z = this.camera.position.z;

      this.camera.position.lerp(desired, this.followLerp);

      if (locked) {
        const lookTarget = this.camera.position.clone().add(this.baseForward);
        this.camera.lookAt(lookTarget);
      } else {
        this.camera.lookAt(targetPos);
      }
    }
  };
}

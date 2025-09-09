
import Application2D from "./Application2D.mjs";
import THREEManager from "./managers/THREEManager.mjs";
import { VerletPhysics } from "./physics/VerletPhysics.mjs";

class Application3D extends Application2D {
    /** @type {THREEManager} */
    three;    

    /** @type {VerletPhysics} */
    phys;

    initManagers() {
        super.initManagers();
        this.three = new THREEManager();
        this.phys = new VerletPhysics(false)
    }

    showMainDivElement() {
        super.showMainDivElement();
        document.getElementById('canvas3d').classList.add('visible');
    }
}

export default Application3D;
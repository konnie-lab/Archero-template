import { Body, World } from 'cannon-es';
// import CannonDebugger from 'cannon-es-debugger';
import { Object3D } from 'three-161';
import Utility3D from '../modules/utils/Utility3D.mjs';


export default class CannonPhysics {
    world = new World();
    materials = {};

    #fixedTimeStep = 1/60;
	#maxSubSteps = 5;
    #links = [];
    isDebug = false;

    constructor( isDebug=false ) {
        this.isDebug = isDebug;

        if ( isDebug ) {
            this.cannonDebugger = new CannonDebugger( app.three.scene, this.world );
        }

        this.world.broadphase.useBoundingBoxes = true;         

        this.world.gravity.set(0, -0.982, 0);
        app.loop.add( this.update );
    }

    /**
     * 
     * @param {Vec3} position 
     * @param {Number} radius 
     * @returns {Body[]}
     */
    getBodiesInSphere(position, radius) {
        let bodies = [];

        for (let body of this.world.bodies) {
            let distacnce = Utility3D.distanceBetween3DPositions(body.position, position);
            if (distacnce <= radius) bodies.push(body);
        }

        return bodies;
    }

    linkModelToBody(model, body) {
        let link = new LinkModelToBody(model, body);
        this.#links.push( link );
    }

    deleteLink(model) {
        let link = this.#links.filter(link => link.model === model)[0];
        link.stop();
        let index = this.#links.indexOf(link);
        if (index != -1) this.#links.splice(index, 1);
    }

    forceSimulate( steps ) {
        for (let i = 0; i < steps; i++ ) {
            this.world.step( this.#fixedTimeStep, this.#fixedTimeStep * 1000, this.#maxSubSteps );            
        }
    }

    update = (deltaTime) => {        
        this.world.step( this.#fixedTimeStep, deltaTime, this.#maxSubSteps );
        if ( this.isDebug ) this.cannonDebugger.update();
    }
}


class LinkModelToBody {
    /** @type {Object3D} */
    model; 

    /** @type {Body} */
    body;

    constructor(model, body) {
        this.model = model;
        this.body = body;

        app.loop.add(this.#update);
    }

    #update = () => {
        this.model.position.copy( this.body.position );        

        this.model.quaternion.set(
            this.body.quaternion.x,
            this.body.quaternion.y,
            this.body.quaternion.z,
            this.body.quaternion.w
        )        
    }

    stop() {
        app.loop.remove(this.#update);
    }
}
import {utils} from "pixi-7.4.2";
import { Box3, BoxGeometry, CylinderGeometry, Mesh, MeshBasicMaterial, Object3D } from "three-161";

export class VerletBody extends utils.EventEmitter{
    #oldX;
    #oldZ;

    debugModel;    

    drag;
    model;
    shape;
    isStatic;    
    isSensor;    

    static EVENT_COLLIDE = 'collide';

    constructor( model, shape, drag=0.1, isStatic=false, isSensor=false ) {
        super();
        this.model = model;
        this.shape = shape;
        this.drag = drag;
        this.isStatic = isStatic;
        this.isSensor = isSensor;
       
        this.#oldX = model.position.x;
        this.#oldZ = model.position.z;        
    }

    update() {
        if ( this.isStatic || this.isSensor ) return;
    
        let vx = this.model.position.x - this.#oldX;
        let vz = this.model.position.z - this.#oldZ;
    
        this.#oldX = this.model.position.x;
        this.#oldZ = this.model.position.z;
    
        this.model.position.x += vx * this.drag;
        this.model.position.z += vz * this.drag;
    }
}

export class CircleShape {
    radius;
    radius2;

    constructor( radius ) {
        this.radius = radius;
        this.radius2 = radius * radius;
    }    
}

export class RectangleShape {
    radiusX;
    radiusZ;   
    rotation;
    
    constructor( width, heigth, rotation=0 ) {
        this.radiusX = width / 2;
        this.radiusZ = heigth / 2;
        this.rotation = rotation;
    }
}

export class VerletPhysics {
    #isDebug = false;
    #debugColors = {
        static: 0xff0000,
        sensor: 0x00ff00,
        dynamic: 0x0000ff,
    }

    bodies = [];

    constructor( isDebug = false ) {
        this.#isDebug = isDebug;
        app.loop.add( this.#update );
    }

    /**
     * Add Object3D to phys world
     * @param {Object3D} model 
     * @param {CircleShape|RectangleShape} shape 
     * @param {Boolean} isStatic 
     * @returns {VerletBody}
     */
    addModel( model, shape, isStatic = false, isSensor = false ) {
        let body = new VerletBody( model, shape, null, isStatic, isSensor );
        model.userData.body = body;
        this.bodies.push( body );

        if ( this.#isDebug ) {
            if ( body.shape instanceof CircleShape ) this.#addDebugCircle( body );
            if ( body.shape instanceof RectangleShape ) this.#addDebugBox( body );            
            if (model.parent) model.parent.add( body.debugModel );
            model.addEventListener( 'added', this.#onModelAdded );
        }

        return body;
    }

    addStaticBody( position, shape, parent = null, isSensor = false ) {
        let model = new Object3D();
        if (parent) parent.add( model );
        model.position.copy( position );
        let body = this.addModel( model, shape, true, isSensor );

        return body;
    }    

    #onModelAdded = (event) => {
        let model = event.target;
        let debugModel = model.userData.body.debugModel;
        model.parent.add( debugModel );
    }

    #update = () => {
        for (let i = 0; i < this.bodies.length; i++) {
            let body1 = this.bodies[i];

            for (let j = i+1; j < this.bodies.length; j++) {
                let body2 = this.bodies[j];

                if ( body1.isStatic && body2.isStatic ) continue;

                if ( body1.shape instanceof CircleShape && body2.shape instanceof CircleShape ) {
                    let isCollide = this.testCircleToCirlce( body1, body2 );
                    if ( isCollide ) this.emitCollideEvents( body1, body2 );
                    continue;
                }

                if ( body1.shape instanceof RectangleShape && body2.shape instanceof RectangleShape ) {
                    let isCollide = this.testRectToRect( body1, body2 );                    
                    if ( isCollide ) this.emitCollideEvents( body1, body2 );
                    continue;
                }

                if ( body1.shape instanceof CircleShape && body2.shape instanceof RectangleShape ) {
                    let isCollide;

                    if ( body2.shape.rotation == 0) isCollide = this.testCircleToRect( body1, body2 )
                    else isCollide = this.testCircleToRect2( body1, body2 );

                    if ( isCollide ) this.emitCollideEvents( body1, body2 );
                    continue;
                }

                if ( body1.shape instanceof RectangleShape && body2.shape instanceof CircleShape ) {
                    let isCollide;

                    if ( body1.shape.rotation == 0) isCollide = this.testCircleToRect( body2, body1 )
                    else isCollide = this.testCircleToRect2( body2, body1 );
                
                    if ( isCollide ) this.emitCollideEvents( body1, body2 );
                    continue;
                }
            }
        }

        for ( let body of this.bodies ) {
            body.update();
        }

        if ( this.#isDebug ) {
            for ( let body of this.bodies ) {
                if ( !body.isStatic ) body.debugModel.position.copy( body.model.position );
            }
        }
    }

    emitCollideEvents( body1, body2 ) {
        body1.emit( VerletBody.EVENT_COLLIDE, body2, body1 );
        body2.emit( VerletBody.EVENT_COLLIDE, body1, body2 );
    }

    testCircleToCirlce( body1, body2 ) {
        let distanceX = body1.model.position.x - body2.model.position.x;
        let distanceZ = body1.model.position.z - body2.model.position.z;        

        let distance = Math.sqrt( distanceX**2 + distanceZ**2 );
        let delta = ( body1.shape.radius + body2.shape.radius ) - distance;

        if ( delta <= 0 ) return false;        
        
        if ( body1.isSensor || body2.isSensor ) return true;        
        
        let deltaX = delta * ( distanceX / distance );
        let deltaZ = delta * ( distanceZ / distance );

        let halfDeltaX = deltaX * 0.5;
        let halfDeltaZ = deltaZ * 0.5;

        body1.model.position.x += body1.isStatic ? 0 : ( body2.isStatic ? deltaX : halfDeltaX );
        body2.model.position.x -= body2.isStatic ? 0 : ( body1.isStatic ? deltaX : halfDeltaX );

        body1.model.position.z += body1.isStatic ? 0 : ( body2.isStatic ? deltaZ : halfDeltaZ );
        body2.model.position.z -= body2.isStatic ? 0 : ( body1.isStatic ? deltaZ : halfDeltaZ );            
        
        return true;
    }

    testRectToRect( body1, body2 ) {
        let distanceX = body1.model.position.x - body2.model.position.x;
        let distanceZ = body1.model.position.z - body2.model.position.z;

        let deltaX = ( body1.shape.radiusX + body2.shape.radiusX ) - Math.abs( distanceX );

        if ( deltaX <= 0 ) return false; 

        let deltaZ = ( body1.shape.radiusZ + body2.shape.radiusZ ) - Math.abs( distanceZ );

        if ( deltaZ <= 0 ) return false;
       
        if ( body1.isSensor || body2.isSensor ) return true;

        if ( deltaX < deltaZ ) {
            let nx = distanceX > 0 ? 1 : -1;
            deltaX *= nx;
            let halfDeltaX = deltaX * 0.5;
            body1.model.position.x += body1.isStatic ? 0 : ( body2.isStatic ? deltaX : halfDeltaX );
            body2.model.position.x -= body2.isStatic ? 0 : ( body1.isStatic ? deltaX : halfDeltaX );
        } else {
            let nz = distanceZ > 0 ? 1 : -1;
            deltaZ *= nz;    
            let halfDeltaZ = deltaZ * 0.5;                     
            body1.model.position.z += body1.isStatic ? 0 : ( body2.isStatic ? deltaZ : halfDeltaZ );
            body2.model.position.z -= body2.isStatic ? 0 : ( body1.isStatic ? deltaZ : halfDeltaZ );
        }
        
        return true;
    }

    testCircleToRect( body1, body2 ) {
        let distanceX = body1.model.position.x - body2.model.position.x;
        let distanceZ = body1.model.position.z - body2.model.position.z;

        let absDistanceX = Math.abs( distanceX );
        let absDistanceZ = Math.abs( distanceZ );

        let deltaX = ( body1.shape.radius + body2.shape.radiusX ) - absDistanceX;

        if ( deltaX <= 0 ) return false; 

        let deltaZ = ( body1.shape.radius + body2.shape.radiusZ ) - absDistanceZ;

        if ( deltaZ <= 0 ) return false;
        
        if ( body1.isSensor || body2.isSensor ) return true;
        
        if ( absDistanceX < body2.shape.radiusX || absDistanceZ < body2.shape.radiusZ ) {
            if ( deltaX < deltaZ ) {
                let nx = distanceX > 0 ? 1 : -1;
                deltaX *= nx;
                let halfDeltaX = deltaX * 0.5;
                body1.model.position.x += body1.isStatic ? 0 : ( body2.isStatic ? deltaX : halfDeltaX );
                body2.model.position.x -= body2.isStatic ? 0 : ( body1.isStatic ? deltaX : halfDeltaX );
            } else {
                let nz = distanceZ > 0 ? 1 : -1;
                deltaZ *= nz;    
                let halfDeltaZ = deltaZ * 0.5;                     
                body1.model.position.z += body1.isStatic ? 0 : ( body2.isStatic ? deltaZ : halfDeltaZ );
                body2.model.position.z -= body2.isStatic ? 0 : ( body1.isStatic ? deltaZ : halfDeltaZ );
            }

            return true;
        }

        distanceX = absDistanceX - body2.shape.radiusX;
        distanceZ = absDistanceZ - body2.shape.radiusZ;

        let distance2 = distanceX * distanceX + distanceZ * distanceZ;
        let delta2 = distance2 - body1.shape.radius2;

        if (delta2 < 0) {
            let distance = Math.sqrt( distance2 );
            let delta = distance - body1.shape.radius;

            let deltaX = distanceX / distance * delta;
            let deltaZ = distanceZ / distance * delta;

            if (body1.model.position.x > body2.model.position.x) deltaX = -deltaX;
            if (body1.model.position.z > body2.model.position.z) deltaZ = -deltaZ;

            let halfDeltaX = deltaX * 0.5;
            body1.model.position.x += body1.isStatic ? 0 : ( body2.isStatic ? deltaX : halfDeltaX );
            body2.model.position.x -= body2.isStatic ? 0 : ( body1.isStatic ? deltaX : halfDeltaX );

            let halfDeltaZ = deltaZ * 0.5;                     
            body1.model.position.z += body1.isStatic ? 0 : ( body2.isStatic ? deltaZ : halfDeltaZ );
            body2.model.position.z -= body2.isStatic ? 0 : ( body1.isStatic ? deltaZ : halfDeltaZ );
            
            return true;
        }  
        
        return false;
    }

    testCircleToRect2( body1, body2 ) {
        let dx = body1.model.position.x - body2.model.position.x;
        let dz = body1.model.position.z - body2.model.position.z;        

        let cos = Math.cos( 2*Math.PI - body2.shape.rotation );
        let sin = Math.sin( 2*Math.PI - body2.shape.rotation );

        let distanceX = dx * cos + dz * sin;
        let distanceZ = dx * sin - dz * cos;

        let absDistanceX = Math.abs( distanceX );
        let absDistanceZ = Math.abs( distanceZ );

        let deltaX = ( body1.shape.radius + body2.shape.radiusX ) - absDistanceX;

        if ( deltaX <= 0 ) return false; 

        let deltaZ = ( body1.shape.radius + body2.shape.radiusZ ) - absDistanceZ;

        if ( deltaZ <= 0 ) return false;       
        
        if ( body1.isSensor || body2.isSensor ) return true;        
        
        if ( absDistanceX < body2.shape.radiusX || absDistanceZ < body2.shape.radiusZ ) {
            if ( deltaX < deltaZ ) {
                let nx = distanceX > 0 ? 1 : -1;
                deltaX *= nx;                

                let dx = deltaX * cos;
                let dz = deltaX * sin;

                let halfDX = dx / 2;
                let halfDZ = dz / 2;

                body1.model.position.x += body1.isStatic ? 0 : ( body2.isStatic ? dx : halfDX );
                body2.model.position.x -= body2.isStatic ? 0 : ( body1.isStatic ? dx : halfDX );

                body1.model.position.z += body1.isStatic ? 0 : ( body2.isStatic ? dz : halfDZ );
                body2.model.position.z -= body2.isStatic ? 0 : ( body1.isStatic ? dz : halfDZ );
            } else {               
                let nz = distanceZ > 0 ? 1 : -1; 
                deltaZ *= nz;

                let dx = deltaZ * sin;
                let dz = -deltaZ * cos;

                let halfDX = dx / 2;
                let halfDZ = dz / 2;              

                body1.model.position.x += body1.isStatic ? 0 : ( body2.isStatic ? dx : halfDX );
                body2.model.position.x -= body2.isStatic ? 0 : ( body1.isStatic ? dx : halfDX );

                body1.model.position.z += body1.isStatic ? 0 : ( body2.isStatic ? dz : halfDZ );
                body2.model.position.z -= body2.isStatic ? 0 : ( body1.isStatic ? dz : halfDZ );
            }

            return true;
        }       

        distanceX = absDistanceX - body2.shape.radiusX;
        distanceZ = absDistanceZ - body2.shape.radiusZ;

        let distance2 = distanceX * distanceX + distanceZ * distanceZ;
        let delta2 = distance2 - body1.shape.radius2;

        if (delta2 < 0) {
            let distance = Math.sqrt( distance2 );
            let delta = distance - body1.shape.radius;

            let deltaX = distanceX / distance * delta;
            let deltaZ = distanceZ / distance * delta;

            if (body1.model.position.x > body2.model.position.x) deltaX = -deltaX;
            if (body1.model.position.z > body2.model.position.z) deltaZ = -deltaZ;

            let halfDeltaX = deltaX * 0.5;
            body1.model.position.x += body1.isStatic ? 0 : ( body2.isStatic ? deltaX : halfDeltaX );
            body2.model.position.x -= body2.isStatic ? 0 : ( body1.isStatic ? deltaX : halfDeltaX );

            let halfDeltaZ = deltaZ * 0.5;                     
            body1.model.position.z += body1.isStatic ? 0 : ( body2.isStatic ? deltaZ : halfDeltaZ );
            body2.model.position.z -= body2.isStatic ? 0 : ( body1.isStatic ? deltaZ : halfDeltaZ );
            
            return true;
        }  
        
        return false;
    }

    removeBody( body ) {
        let index = this.bodies.indexOf( body );
        if ( index != -1 ) {
            let body = this.bodies.splice( index, 1 )[0];
            
            if ( body.debugModel ) {
                body.debugModel.removeFromParent();
                body.model.removeEventListener( 'added', this.#onModelAdded );
                body.debugModel = undefined;
            }
        }
    }

    getBodyByModel( model ) {
        for ( let body of this.bodies ) {
            if ( model == body.model ) return body;
        }

        return null;
    }

    #addDebugCircle( body ) {
        let bounds = new Box3().setFromObject( body.model );
        let height = Math.max(1, bounds.max.y);

        let debugColor = this.#debugColors['dynamic'];
        if ( body.isStatic ) debugColor = this.#debugColors['static'];
        if ( body.isSensor ) debugColor = this.#debugColors['sensor'];        

        let geometry = new CylinderGeometry( body.shape.radius, body.shape.radius, height, 16);
        geometry.translate(0, height / 2, 0);
        let material = new MeshBasicMaterial({ color: debugColor, wireframe:true });
        body.debugModel = new Mesh(geometry, material);     
        body.debugModel.position.copy( body.model.position );   
    }

    #addDebugBox( body ) {
        let bounds = new Box3().setFromObject( body.model );    
        let height = Math.max(1, bounds.max.y);   

        let debugColor = this.#debugColors['dynamic'];
        if ( body.isStatic ) debugColor = this.#debugColors['static'];
        if ( body.isSensor ) debugColor = this.#debugColors['sensor'];

        let geometry = new BoxGeometry( body.shape.radiusX * 2, height, body.shape.radiusZ * 2);
        geometry.translate(0, height / 2, 0);        
        let material = new MeshBasicMaterial({ color: debugColor, wireframe:true });        
        body.debugModel = new Mesh( geometry, material );        
        body.debugModel.rotation.y = body.shape.rotation;
        body.debugModel.position.copy( body.model.position );
    }
}

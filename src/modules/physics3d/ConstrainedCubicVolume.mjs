import { Body, Box, Material, Vec3 } from "cannon-es";

export default class ConstrainedCubicVolume {
    /**@type {Body} */
    body;

    constructor(size) {
        let thick = 0.25;
        let {width, height, length} = size;

        let material = new Material({ friction: 0.01 });

        this.body = new Body({
            mass: 0,            
            material   
        });        
        
        let leftShape = new Box( new Vec3(thick/2, height/2, length/2) );
        let rightShape = new Box( new Vec3(thick/2, height/2, length/2) );
        let frontShape = new Box( new Vec3(width/2, height/2, thick/2) );
        let backShape = new Box( new Vec3(width/2, height/2, thick/2) );
        let topShape = new Box( new Vec3(width/2, thick/2, length/2) );
        let bottomShape = new Box( new Vec3(width/2, thick/2, length/2) );

        this.body.addShape( leftShape, new Vec3(-width/2 - thick/2, 0, 0) );
        this.body.addShape( rightShape, new Vec3(width/2 + thick/2, 0, 0) );

        this.body.addShape( frontShape, new Vec3(0, 0, length/2 + thick/2) );
        this.body.addShape( backShape, new Vec3(0, 0, -length/2 - thick/2) );

        this.body.addShape( topShape, new Vec3(0, -height/2 - thick/2, 0) );
        this.body.addShape( bottomShape, new Vec3(0, height/2 + thick/2, 0) );
    }
}
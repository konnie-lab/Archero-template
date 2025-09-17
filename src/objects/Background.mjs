
import { Mesh, MeshPhongMaterial, PlaneGeometry } from "three-161";

export class Background {
    constructor(textureKey) {

        this.map = app.three.getMap(textureKey, true);
        this.geometry = new PlaneGeometry(30, 40);

        this.material = new MeshPhongMaterial({
            map : this.map,
            transparent: true,
            depthWrite: false,
        });

        this.backgroundMesh = new Mesh(this.geometry, this.material);
        this.backgroundMesh.receiveShadow = true;
    }
        
}
// objects/Walls.mjs
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, DoubleSide } from "three-161";
import { RectangleShape } from "../modules/physics/VerletPhysics.mjs";

export default class Walls {
    display;
    material;
    thickness = 0.6;
    yOffset = 0.01;

    constructor(parentGroup, {
        bounds,
        show = true,
        color = 0x00a2ff,
        alpha = 0.25,
    }) {
        this.display = new Group();
        this.display.name = "Walls";
        parentGroup.add(this.display);

        this.material = new MeshBasicMaterial({
            color, transparent: true, opacity: alpha, side: DoubleSide
        });

        this.createBounds(bounds, show);
    }

    createBounds({ minX, maxX, minZ, maxZ }, show) {
        let widthX = maxX - minX;
        let depthZ = maxZ - minZ;

        // LEFT
        this.createWall({
            x: minX,
            z: (minZ + maxZ) * 0.5,
            width: this.thickness,
            depth: depthZ,
            show
        });

        // RIGHT
        this.createWall({
            x: maxX,
            z: (minZ + maxZ) * 0.5,
            width: this.thickness,
            depth: depthZ,
            show
        });

        // TOP 
        this.createWall({
            x: (minX + maxX) * 0.5,
            z: minZ,
            width: widthX,
            depth: this.thickness,
            show
        });

        // BOTTOM 
        this.createWall({
            x: (minX + maxX) * 0.5,
            z: maxZ,
            width: widthX,
            depth: this.thickness,
            show
        });
    }

    createWall({ x, z, width, depth, show }) {
    let shape = new RectangleShape(width, depth, 0);
    let wallBody = app.phys.addStaticBody({ x, y: 0, z }, shape, this.display, false);
    wallBody.isWall = true; // important marker for projectile collision

    if (show) {
        let plane = new Mesh(new PlaneGeometry(width, depth), this.material);
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(x, this.yOffset, z);
        this.display.add(plane);
    }
}

    setVisible(isVisible) {
        this.display.visible = !!isVisible;
    }
}

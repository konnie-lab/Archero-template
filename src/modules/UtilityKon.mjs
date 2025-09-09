import { Quaternion, Vector3 } from "three-161";

export default class UtilityKon {
    static reparentWithWorldTransform(child, oldParent, newParent) {

        // save world transform
        const worldPos = new Vector3();
        const worldQuat = new Quaternion();
        const worldScale = new Vector3();

        child.getWorldPosition(worldPos);
        child.getWorldQuaternion(worldQuat);
        child.getWorldScale(worldScale);

        // transfer to new parent
        oldParent.remove(child);
        newParent.add(child);

        child.userData.isChip = true;

        // position → local
        newParent.worldToLocal(worldPos);
        child.position.copy(worldPos);

        //worldQuat → localQuat =  inverse(parentQuat) * worldQuat 
        const parentQuatInv = new Quaternion()
            .copy(newParent.getWorldQuaternion(new Quaternion()))
            .invert();

        child.quaternion.copy(parentQuatInv.multiply(worldQuat));

        // scale copy
        child.scale.copy(worldScale);
    }
}
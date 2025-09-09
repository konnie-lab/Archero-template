export default class Utility3D {   

    static distanceBetween3DObjects(obj1, obj2) {
        let dx = obj2.position.x - obj1.position.x;
        let dy = obj2.position.y - obj1.position.y;
        let dz = obj2.position.z - obj1.position.z;
        return Math.sqrt(dx ** 2 + dy**2 + dz ** 2);
    }

    static angleBetweenObjects(obj1, obj2) {
        let dx = obj2.position.x - obj1.position.x;
        let dz = obj2.position.z - obj1.position.z;
        return Math.atan2(dx, dz);
    }    

    static inflateGeometry(geometry, amount) {
        let inflatedGeometry = geometry.clone();
       
        let positions = inflatedGeometry.attributes.position;
        let normals = inflatedGeometry.attributes.normal;
        
        let newPosition = [];
        
        for (let i = 0; i < positions.count; i++) {
            let vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
            let normal = new THREE.Vector3().fromBufferAttribute(normals, i);
            
            vertex.addScaledVector(normal, amount);
            newPosition.push(vertex.x, vertex.y, vertex.z);
        }
        
        inflatedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPosition, 3));
    
        return inflatedGeometry;
    }    
}
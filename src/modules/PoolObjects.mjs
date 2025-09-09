let objects = {};

export default class PoolObjects {

    static add( type, object ) {
        if (objects[type] === undefined) 
            objects[type] = [];

        objects[type].push( object );
    }

    static get( type ) {
        if (objects[type] !== undefined) {
            return objects[type].pop();
        }
    }
};

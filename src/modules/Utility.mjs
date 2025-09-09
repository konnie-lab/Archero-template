export default class Utility {

    // Sensei Section

    static distance(x1, y1, x2, y2) {
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.sqrt(dx ** 2 + dy ** 2);
    }

    static distanceBetweenObjects(obj1, obj2) {
        let dx = obj2.x - obj1.x;
        let dy = obj2.y - obj1.y;
        return Math.sqrt(dx ** 2 + dy ** 2);
    }

    static lerp(value1, value2, damping) {
        return (1 - damping) * value1 + value2 * damping;
    }

    static scale(value, inMin, inMax, outMin, outMax) {
        return (Math.min(Math.max(value, inMin), inMax) - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
    }

    static randomRange(min, max) {
        let random = min + Math.random() * (max + 1 - min);
        return random;
    }

    static randomInteger(min, max) {
        let random = min + Math.random() * (max + 1 - min);
        return Math.floor(random);
    }

    static randomFromArray(array) {
        let idx = Math.floor(array.length * Math.random());
        return array[idx];
    }

    static randomElementsFromArray(array, amount) {
        let randomItems = [];

        for (let index = 0; index < amount; index++) {
            let idx = Math.floor(array.length * Math.random());
            randomItems.push(array[idx]);
        }

        return randomItems;
    }

    static randomUniqueElementsFromArray(array, amount) {
        let randomItems = [];

        if (array.length < amount) {
            console.warn('amount is smallest than array length');
            return;
        }

        while (randomItems.length < amount) {
            let idx = Math.floor(array.length * Math.random());
            let element = array[idx];
            if (!randomItems.includes(element)) {
                randomItems.push(element);
            }
        }

        return randomItems;
    }

    static removeItemFromArray(item, array) {
        let idx = array.indexOf(item);
        if (idx != -1) array.splice(idx, 1);
    }

    static mixArray(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    static shuffleArray(array) {
        this.mixArray(array);
    }

    static countInArray(array, compareFunction) {
        let counter = 0;

        array.forEach(element => {
            if (compareFunction(element)) {
                counter++;
            }
        })

        return counter;
    }

    static getLocalPositionFor(currentViewObject, targetViewObject) {
        return currentViewObject.toLocal(
            targetViewObject.parent.toGlobal(targetViewObject.position),
        );
    }

    static setSamePositionAs(viewObject, targetViewObject) {
        viewObject.position = this.getLocalPositionFor(
            viewObject.parent,
            targetViewObject,
        );
    }

}
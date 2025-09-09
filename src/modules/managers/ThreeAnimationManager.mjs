import { AnimationMixer } from 'three-161';

export default class THREEAnimationManager {
    obj3d;
    mixer;   
    animSpeed;

    currentName = '';
    actions = {};

    constructor(obj3d, animations, animSpeed = 1 / 25) {
        this.obj3d = obj3d;
        this.animations = animations;
        this.animSpeed = animSpeed;
        this.callbacks = new Map();

        this.mixer = new AnimationMixer(obj3d);

        for (let index = 0; index < animations.length; index++) {
            let animationName = animations[index].name;
            let animationAction = this.mixer.clipAction(animations[index]);
            
            this.actions[animationName] = animationAction;
            animationAction.name = animationName;
            animationAction.clampWhenFinished = false;
        }

        app.loop.add(this.#onUpdate);
    }

    set(name, seekTime, fadeTime = 0.1) {
        if (this.currentName !== name && this.actions[this.currentName]) 
            this.actions[this.currentName].fadeOut(fadeTime);

        this.currentName = name;
        this.actions[name].reset();

        if (this.currentName !== name) 
            this.actions[name].fadeIn(fadeTime);

        this.actions[name].play();

        if (seekTime !== undefined) 
            this.seek(seekTime);
    }    

    seek(time) {
        this.actions[this.currentName].time = time;
    }

    #onUpdate = () => {
        this.mixer.update(this.animSpeed);
    }    
}

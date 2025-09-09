import { AnimatedSprite } from "pixi-7.4.2";
import { Task } from "../../managers/TaskManager.mjs";



export class WaitTask extends Task {
    #time;   
    
    /**
     * Create new WaitTask
     * @param {Object} options
     * @param {Number} options.time 
     */
    constructor({ time }) {
        super();
        this.#time = time;
        this.isAsync = true;
    }

    do() {
        app.gsap.delayedCall( this.#time, ()=>this.onComplete() );
    }	
}


export class FuncTask extends Task {
    #func;
    #args;

    /**
     * Create new FuncTask
     * @param {Object} options
     * @param {Function} options.func 
     * @param {Array} options.args 
     * @param {Boolean} options.isAsync
     */
    constructor({ func, args=[], isAsync=false }) {
        super();
        this.#func = func;
        this.#args = args;
        this.isAsync = isAsync;
    }

	do() {
        this.#func( ...this.#args );
        if ( !this.isAsync ) this.onComplete();
    }	
}


export class EventTask extends Task {
    #event;

	constructor({event}) {
        super();
        this.#event = event;        
    }

    do() {
        app.eventEmitter.emit( this.#event );
        this.onComplete();
    }	
}


export class ShowTask extends Task {
    #display;

	constructor({display}) {
        super();
        this.#display = display;
    }

    do() {
        this.#display.visible = true;
        this.onComplete();
    }	
}


export class HideTask extends Task {
    #display;

	constructor({display}) {
        super();
        this.#display = display;
    }

    do() {
        this.#display.visible = false;
        this.onComplete();
    }	
}


export class PlaySoundTask extends Task {
    #soundName
    #options
	
    constructor({name, options}) {
        super();
        this.#soundName = name;
        this.#options = options;
    }

    do() {
        app.sound.play( this.#soundName, this.#options );
        this.onComplete();
    }	
}


export class StopSoundTask extends Task {
    #soundName    
	
    constructor({name}) {
        super();
        this.#soundName = name;
    }

    do() {
        app.sound.stop( this.#soundName );
        this.onComplete();
    }	
}


export class TweenTask extends Task {
    #tween    
	
    constructor({tween, isAsync=true}) {
        super();
        tween.pause();
        this.#tween = tween;
        this.isAsync = isAsync; 
    }

    do() {
        this.#tween.play(0);

        if (this.isAsync) {
            this.#tween.eventCallback("onComplete", ()=>this.onComplete());
        } else {
            this.onComplete();
        }
    }	
}


export class AnimationTask extends Task {
    /** @type {AnimatedSprite} */
    #animation    
	
    constructor({animation, isAsync=true}) {
        super();
        this.isAsync = isAsync;
        this.#animation = animation;
    }

    do() {
        this.#animation.gotoAndPlay(0);

        if (this.isAsync) {
            this.#animation.loop = false;
            this.#animation.onComplete = ()=>this.onComplete();
        } else {
            this.onComplete();
        }    
    }	
}

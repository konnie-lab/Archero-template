export default class GameLoopManager {

    #isPause = false;
    #callStack = new Set();
    #currentTime = 0;
    #previousTime = 0;
    #frameDuratioMs = 0;    

    constructor ( {fps = 40, autoStart = true} ) {
        this.#frameDuratioMs = 1000 / fps;
        if ( autoStart ) this.start();
        else this.#isPause = true;
    }
    
    start () {        
        this.#isPause = false;
        this.#loop();
    }

    stop () {
        this.#isPause = true;
    }

    add ( loopFunction ) {
        this.#callStack.add( loopFunction );
    }

    remove ( loopFunction ) {
        this.#callStack.delete( loopFunction );
    }    

    #loop = () => {        
        if ( this.#isPause ) return;       

        this.#currentTime = performance.now();
        let deltaTime = this.#currentTime - this.#previousTime;

        if ( deltaTime >= this.#frameDuratioMs ) {
            this.#previousTime = this.#currentTime;
            this.#callStack.forEach( loop => loop( this.#frameDuratioMs ) );
        }
        
        requestAnimationFrame( this.#loop );
    }
}
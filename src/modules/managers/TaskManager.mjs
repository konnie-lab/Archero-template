export default class TaskManager {
    #isLoop;

    #tasks = [];   
    #currId = 0;

	/** @type {Task} */
	#currentTask;s

	/**
	 * Create new TaskManager
	 * @param {Object} options
	 * @param {Array<Task>} options.tasks
	 * @param {Boolean} options.isLoop
	 * @param {Boolean} options.isAutoStart
	 */
    constructor({ tasks, isLoop=false, isAutoStart=false } = {}) {
		this.#isLoop = isLoop;		
		if (tasks) this.add( ...tasks );
		if (isAutoStart) this.start();
    }

	/**
	 * Add tasks to manager
	 * @param  {...Task} tasks
	 */
    add( ...tasks ) {
        this.#tasks.push( ...tasks );
    }

    #next = () => {
		if ( this.#currId >= this.#tasks.length ) {
			if (this.onComplete) this.onComplete();
			this.#currId = 0;			
            if ( !this.#isLoop ) return;
        }
		
		if ( this.#currentTask ) this.#currentTask.onComplete = Task.EMPTY_FUNCTION;
		this.#currentTask = this.#tasks[ this.#currId ];
		this.#currentTask.onComplete = this.#next;
        this.#currId++;

		this.#currentTask.do();
	}	

	start() {
		if (this.#tasks.length === 0) 
			return;

        this.#next();

		return this;
    }	

	reset() {
		this.#currId = 0;
	}

	clear() {
		this.#currId = 0;
		this.#tasks.length = 0;
		this.#isLoop = false;
	}

	onComplete() {

	}
}

export class Task {
	static EMPTY_FUNCTION = ()=>{};
    isAsync = false;
    onComplete = Task.EMPTY_FUNCTION;
    do() {};
}
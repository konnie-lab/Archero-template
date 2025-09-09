export class State {
    predicates = [];
    stateMachine;
    enter(){};
    update(){};
    exit(){};
    addPredicate( predicate ) {        
        this.predicates.push( predicate );
    }
}

export class Predicate {
    stateMachine;
    check() {};
}

export class StateManager {
    states = new Map();
    current = new State();

    constructor() {
        this.add( ...arguments );
    }

    update = () => {
        this.current.update();
        for ( let predicate of this.current.predicates ) {
            predicate.check();
        }
    }

    set(stateClass, parameters) {
        let state = this.states.get(stateClass);

        if (!state) {
            console.warn('Такого State не существует');
            return;
        }

        if (this.current === state) return;

        this.current.exit();
        this.current = state;
        this.current.enter( parameters );
    }

    add() {        
        for (let state of arguments) {
            if (state instanceof State) {                
                state.stateMachine = this;
                state.predicates.forEach( predicate => predicate.stateMachine = this );
                this.states.set(state.constructor, state);
            }            
        }        
    }
}
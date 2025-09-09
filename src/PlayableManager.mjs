import SoundService from './helpers/SoundService.mjs';

import GameController from './gameManagers/GameController.mjs';
import CinematicManager from './gameManagers/CinematicManager.mjs';
import { Hand } from './tutor/Hand.mjs';
import TutorController from './tutor/TutorController.mjs';
import PackShot from './scenes/PackShot.mjs';


export default class PlayableManager {

    constructor(gameScene) {
        this.scene = gameScene;

        this.initSoundService();
        this.initManagers();
        this.initTutor();
        this.initEvents();
        
        this.startMusic();
    }

    // -----------------------------------------------------//
    //                     EVENTS                   
    // -----------------------------------------------------//

    initEvents() {
        app.eventEmitter.once(app.data.EVENTS.ACTIVATE_PACK_SHOT, () => this.onActivatePackShot());
        app.eventEmitter.on(app.data.EVENTS.OPEN_STORE, () => this.onOpenStore());
    }

    // -----------------------------------------------------//
    //                     MANAGERS                   
    // -----------------------------------------------------//

    initManagers() {
        this.gameController = new GameController(this.scene);
        this.cinematicManager = new CinematicManager(this.scene);
    }

    // ----------------------------------------------------//
    //                    TUTOR
    // ----------------------------------------------------//

    initTutor() {
        this.hand = new Hand();
        this.tutorContoller = new TutorController(this.hand, this.scene);
    }

    // -----------------------------------------------------//
    //                     CALLBACKS                   
    // -----------------------------------------------------//

    onActivatePackShot() {
        this.packShot = new PackShot(this.scene);
        app.packShotLayer.addChild(this.packShot.display);
    }

    onOpenStore() {
        app.openStore();
    }

    // -----------------------------------------------------//
    //                     SOUND                     
    // -----------------------------------------------------//

    initSoundService() {
        this.soundService = new SoundService();
    }

    startMusic() {
        app.eventEmitter.emit(app.data.SOUND_EVENTS.START_MUSIC);
    }

    stopMusic() {
        app.eventEmitter.emit(app.data.SOUND_EVENTS.STOP_MUSIC);
    }
}
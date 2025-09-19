import SoundService from './helpers/SoundService.mjs';

import GameController from './gameManagers/GameController.mjs';
import CinematicManager from './gameManagers/CinematicManager.mjs';
import { Hand } from './tutor/Hand.mjs';
import TutorController from './tutor/TutorController.mjs';
import PackShot from './scenes/PackShot.mjs';
import WaveManager from './gameManagers/WaveManager.mjs';
import EnemyManager from './gameManagers/EnemyManager.mjs';
import HeroAttackController from './gameManagers/HeroAttackController.mjs';
import HeroHealthController from './gameManagers/HeroHealthController.mjs';
import EnemyAttackController from './gameManagers/EnemyAttackController.mjs';
import BoostsUI from './ui/BoostsUI.mjs';
import FailBanner from './ui/FailBanner.mjs';
import HpBarsController from './gameManagers/HpBarsController.mjs';


export default class PlayableManager {

    constructor(gameScene) {
        this.scene = gameScene;

        this.initSoundService();
        this.initManagers();
        this.initTutor();
        this.initUI();
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
        this.waveManager = new WaveManager(this.scene);
        this.enemyManager = new EnemyManager(this.scene);

        this.heroAttack = new HeroAttackController(this.scene.hero, this.scene.worldRoot);
        this.scene.heroAttack = this.heroAttack;
        this.enemyAttack = new EnemyAttackController(this.scene);

        this.heroHealth = new HeroHealthController(this.scene.hero);
        this.scene.heroHealth = this.heroHealth;
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
        app.gameEnd();
    }

    // -----------------------------------------------------//
    //                     UI                     
    // -----------------------------------------------------//

    initUI() {
        this.boostsUI = new BoostsUI(app.overlayLayer);
        this.failBanner = new FailBanner(app.overlayLayer, this.scene);
        this.scene.failBanner = this.failBanner;

        this.hpBarsController = new HpBarsController(app.UILayer, this.scene);
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
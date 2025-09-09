import GameLoopManager from "./managers/GameLoopManager.mjs";
import ResizeManager from "./managers/ResizeManager.mjs";
import AssetsManager from "./managers/AssetsManager.mjs";
import PIXIManager from "./managers/PIXIManager.mjs";
import SoundManager from "./managers/SoundManager.mjs";
import versions from "../../versions.cjs";
import Main from "../Main.mjs";
import {utils} from "pixi-7.4.2";
import Data from "../Data.mjs";
import { settings } from '../../settings.mjs';
import { assets } from '../Assets.mjs';
import gsap from 'gsap-3.12.5';

export default class Application2D {
    /** @type {AssetsManager} */
    assets;

    /** @type {PIXIManager} */
    pixi;   

    /** @type {GameLoopManager} */
    loop;
    
    /** @type {ResizeManager} */
    resize;

    /** @type {SoundManager} */
    sound;

    /** @type {Main} */
    main;

    /** @type {Data} */
    data;

    /** @type {GSAP} */
    gsap;

    /** @type {utils.EventEmitter} */
    eventEmitter;
   
    settings;
    
    #assets;    
    #isPause = false;

    IOS = 'ios';
    ANDROID = 'android';
    
    constructor() {
        this.settings = settings;        
        this.#assets = assets;        
    }

    init() {
        this.initManagers();
        this.assets = new AssetsManager();
        this.assets.loadFiles( this.#assets, this.#start.bind(this) );
    }

    #start() {           
        this.sound.parseAudio();
        this.pixi.parseSheets();
        this.data = new Data();
        this.main = new Main();
        this.main.init();
        this.showMainDivElement();
        this.#initFocusChangeHandler();
    }

    initManagers() {        
        this.eventEmitter = new utils.EventEmitter();
        this.sound = new SoundManager();
        this.loop = new GameLoopManager({ fps: this.settings.fps, autoStart: true });
        this.resize = new ResizeManager();
        this.pixi = new PIXIManager();
        this.gsap = gsap;
    }

    showMainDivElement() {
        document.getElementById('canvas2d').classList.add('visible');
    }

    #initFocusChangeHandler() {
        window.addEventListener('visibilitychange', this.#onFocusChange.bind(this), false);
        this.#onFocusChange();
    }

    #onFocusChange() {        
        if (document.visibilityState === "hidden") {
            this.pause();
        } else {
            this.resume();
        }
    }

    pause() {
        if (this.#isPause) return;
        this.#isPause = true;
        
        this.loop.stop();
        this.sound.mute();
        app.gsap.globalTimeline.pause();
        app.eventEmitter.emit('application_pause');
    }

    resume() {
        if (!this.#isPause) return;
        this.#isPause = false;      

        this.loop.start();
        this.sound.unmute();
        this.sound.unlockAudioContext();

        app.gsap.globalTimeline.resume();
        app.eventEmitter.emit('application_resume');
    }

    get stage() {
        return this.pixi.stage
    }

    get width() {
        return this.pixi.width;
    }

    get height() {
        return this.pixi.height;
    }

    get maxWidth() {
        return this.pixi.maxWidth;
    }

    get maxHeight() {
        return this.pixi.maxHeight;
    }

    get ratio() {
        return this.resize.ratio;
    }

    get ratioName() {
        return this.resize.ratioName;
    }

    ratioLess(ratio) {
        return this.resize.ratioLess(ratio);
    }

    get orientation() {
        return this.resize.orientation;
    }

    get isPortrait() {
        return this.resize.isPortrait;
    }

    get storeLink() {
        let isIos = this.getPlatform() === this.IOS;
        return isIos ? this.settings.store.ios : this.settings.store.android;
    }

    get version() {
        return versions[this.settings.versionId];
    }

    openStore() {       
        window.open( this.storeLink );
    }

    getPlatform() {
        let userAgent = navigator.userAgent || navigator.vendor || window.opera;
        userAgent = userAgent.toLowerCase();
       
        if ((/iphone|ipad|ipod/i).test(userAgent) && !window.MSStream) {
            return this.IOS;
        } 
        
        if (/android/i.test(userAgent)) {
            return this.ANDROID;
        }

        if (navigator.platform.toUpperCase().indexOf('MAC')>=0) {
            return this.IOS;
        }
       
        return 'unknown';
    }

    gameEnd() {
        console.log('game end');
    }
}
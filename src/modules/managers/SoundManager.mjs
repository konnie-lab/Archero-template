import { Howl, Howler } from 'howler-2.2.4';

export default class SoundManager {
    sounds = {};

    #muteCount = 1;

    constructor() {
        Howler.autoUnlock = true;
        Howler.autoSuspend  = false;        
    }

    parseAudio() {
        for (let audioName in app.assets.audios) {
            let audio = app.assets.audios[audioName];
            this.sounds[audioName] = new Howl(audio);
        }
    }

    play(name, {loop = false, volume, rate}={}) {
        if (app.settings.isSounds) { 
            let sound = this.sounds[name];
            sound._loop = loop;
            sound.play();
            if (volume != undefined) sound.volume(volume);
            if (rate != undefined) sound.rate(rate);
        }        
    }

    playLone(name, props) {
        if ( !this.isPlaying(name) ) { 
            this.play(name, props);
        }
    }

    stop(name) {
        if (app.settings.isSounds) {
            this.sounds[name].stop();
        }        
    }

    fadeOut(name, timeInSeconds=0.5) {
        if (app.settings.isSounds) {
            let from = this.sounds[name].volume();
            this.sounds[name].fade(from, 0, timeInSeconds*1000);
        }        
    } 
    
    fadeIn(name, volume=1, timeInSeconds=0.5) {
        if (app.settings.isSounds) {          
            this.sounds[name].fade(0, volume, timeInSeconds*1000);
        }        
    } 

    fade(name, from, to, time) {
        if (app.settings.isSounds) {
            this.sounds[name].fade(from, to, time);
        }        
    }  

    isPlaying(name) {
        return this.sounds[name].playing();
    }

    mute() {
        this.#muteCount -= 1;
        Howler.mute(true);
    }

    unmute() {
        this.#muteCount += 1;
        if (this.#muteCount > 1) this.#muteCount = 1;
        Howler.mute( this.#muteCount < 1 );
    }

    unlockAudioContext() {        
        let events = ["touchstart", "touchend", "mousedown"];
        events.forEach(event => document.body.addEventListener(event, unlock, false));
        
        function unlock() { 
            Howler.ctx.resume().then(clean);
        }

        function clean() { 
            events.forEach(event => document.body.removeEventListener(event, unlock));
        }
    }
}
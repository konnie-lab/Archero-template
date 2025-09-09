export default class HandAnimation {
    display;
    #timeline;

    constructor(imageName, buttonSprite) {
        this.display = app.pixi.sprite(imageName);
        this.display.alpha = 0;
        this.display.x = 50;
        this.display.y = 50;

        this.#timeline = app.gsap.timeline({repeat: -1, repeatDelay: 2, delay: 1, paused: true});
        this.#timeline.to(this.display, 0.25, {x: 0, y: 0, alpha: 1, ease: 'sine.out'});
        this.#timeline.to(this.display.scale, 0.25, {x: 0.9, y: 0.9, ease: 'sine.inOut', repeat: 1, yoyo: true});
        this.#timeline.to(buttonSprite.scale, 0.25, {x: 0.95, y: 0.95, ease: 'sine.inOut', repeat: 1, yoyo: true, delay: -0.5});
        this.#timeline.to(this.display, 0.25, {x: 50, y: 50, alpha: 0, ease: 'sine.in'});
    }

    start() {
        this.#timeline.play(0);
    }

    stop() {
        this.#timeline.pause(0);
    }
}
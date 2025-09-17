// ui/EndBanner.mjs  (твой файл, добавил show/hide + visible=false)
import { BitmapText, Container, Graphics } from "pixi-7.4.2";
import { RATIO_NAMES } from "../modules/managers/ResizeManager.mjs";

export default class FailBanner {
  display;
  title;
  subtitle;

  constructor(parentLayer = app.overlayLayer, scene = null) {
    this.scene = scene;

    this.display = new Container();
    this.display.eventMode = "static";
    this.display.visible = false;          
    this.display.alpha = 0;            
    parentLayer.addChild(this.display);

    this.createDim();
    this.initBanner();
    this.initText();
    this.initButton();
    this.initEvents();

    app.resize.add(this.onResize);
    this.onResize();
  }

  initEvents() {
    this.display.on('pointerdown', () => {
      app.eventEmitter.emit(app.data.EVENTS.OPEN_STORE)
    });
  }

  createDim() {
    this.overlay = new Graphics()
      .beginFill(0x000000, 0.80)
      .drawRect(0, 0, app.width, app.height)
      .endFill();

    this.overlay.eventMode = "static";
    this.display.addChild(this.overlay);
  }

  redrawDim() {
    if (!this.overlay) return;
    this.overlay
      .clear()
      .beginFill(0x000000, 0.80)
      .drawRect(0, 0, app.width, app.height)
      .endFill();
  }

  initText() {
    this.textContainer = new Container();
    this.display.addChild(this.textContainer);

    this.text = app.pixi.sprite('text_fail');
    this.text.anchor.set(0.5);
    this.textContainer.addChild(this.text);
  }

  initBanner() {
    this.bannerContainer = new Container();
    this.display.addChild(this.bannerContainer);

    this.shine = app.pixi.sprite('boost_shine2', { anchor: 0.5 });
    this.shine.scale.set(1.1);
    this.shine.eventMode = 'none';
    gsap.to(this.shine.scale, { x: 1, y: 1, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    this.bannerBase = app.pixi.sprite('boost_base_green', { anchor: 0.5 });
    this.iconSprite = app.pixi.sprite('icon_fire', { anchor: 0.5 });
    this.iconSprite.position.set(0, -45);

    this.label = new BitmapText('FIRE', {
      fontName: "BerlinSansFBDemi-Bold",
      fontSize: 28,
      align: "center",
    });

    this.label.anchor.set(0.5);
    this.label.position.set(0, 105);

    this.bannerContainer.addChild(this.shine, this.bannerBase, this.iconSprite, this.label);
  }


  initButton() {
    this.buttonContainer = new Container();
    this.display.addChild(this.buttonContainer);

    this.button = app.pixi.sprite('button_try_again', { anchor: 0.5 });
    this.button.scale.set(1.05)
    this.buttonContainer.addChild(this.button);

    gsap.to(this.button.scale, { x: 1, y: 1, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1, });


  }

  onResize = () => {

    this.redrawDim();

    let mode = app.resize.ratioLess('SM')
      ? 'TABLET'
      : (app.resize.ratioName === RATIO_NAMES.XLG ? 'TALL' : 'DEFAULT');

    switch (mode) {
      case 'TABLET': {
        // 4:3, 16:10, etc.
        if (app.isPortrait) {
          this.textContainer.position.set(app.width / 2, app.height / 2 - 300);
          this.bannerContainer.position.set(app.width / 2, app.height / 2);
          this.buttonContainer.position.set(app.width / 2, app.height / 2 + 300);
          this.textContainer.scale.set(0.9);
          this.bannerContainer.scale.set(0.8)
          this.buttonContainer.scale.set(0.75)
        } else {
          this.textContainer.position.set(app.width / 2 - 250, app.height / 2);
          this.bannerContainer.position.set(app.width / 2, app.height / 2);
          this.buttonContainer.position.set(app.width / 2 + 250, app.height / 2);
          this.textContainer.scale.set(0.6);
          this.bannerContainer.scale.set(0.65)
          this.buttonContainer.scale.set(0.65)
        }

        break;
      }

      case 'TALL': {
        // Very tall phones (e.g., iPhone 12/14 Pro Max)
        if (app.isPortrait) {
          this.textContainer.position.set(app.width / 2, app.height / 2 - 400);
          this.bannerContainer.position.set(app.width / 2, app.height / 2);
          this.buttonContainer.position.set(app.width / 2, app.height / 2 + 400);
          this.textContainer.scale.set(1.1);
          this.bannerContainer.scale.set(0.9)
          this.buttonContainer.scale.set(0.95)
        } else {
          this.textContainer.position.set(app.width / 2 - 400, app.height / 2);
          this.bannerContainer.position.set(app.width / 2, app.height / 2);
          this.buttonContainer.position.set(app.width / 2 + 400, app.height / 2);
          this.textContainer.scale.set(0.8);
          this.bannerContainer.scale.set(0.9)
          this.buttonContainer.scale.set(0.85)
        }

        break;
      }

      default: {
        // Default phones / desktop
        if (app.isPortrait) {
          this.textContainer.position.set(app.width / 2, app.height / 2 - 350);
          this.bannerContainer.position.set(app.width / 2, app.height / 2);
          this.buttonContainer.position.set(app.width / 2, app.height / 2 + 350);
          this.textContainer.scale.set(1);
          this.bannerContainer.scale.set(0.9)
          this.buttonContainer.scale.set(0.85)
        } else {
          this.textContainer.position.set(app.width / 2 - 350, app.height / 2);
          this.bannerContainer.position.set(app.width / 2, app.height / 2);
          this.buttonContainer.position.set(app.width / 2 + 350, app.height / 2);
          this.textContainer.scale.set(0.7);
          this.bannerContainer.scale.set(0.9)
          this.buttonContainer.scale.set(0.75)
        }

        break;
      }
    }
  };

  show() {
    if (this.display.visible) return;
    this.display.visible = true;
    this.display.alpha = 0;
    gsap.to(this.display, { alpha: 1, duration: 0.2, ease: 'sine.out' });
  }

  hide() {
    gsap.to(this.display, {
      alpha: 0,
      duration: 0.15,
      ease: 'sine.in',
      onComplete: () => {
        this.display.visible = false;
        this.display.alpha = 1;
      }
    });
  }

  destroy() {
    app.resize.remove(this.onResize);
    this.display.destroy({ children: true });
  }
}

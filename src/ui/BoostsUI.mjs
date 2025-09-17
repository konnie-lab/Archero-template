// ui/BoostsUI.mjs
import { Container, BitmapText, Graphics } from "pixi-7.4.2";
import { RATIO_NAMES } from "../modules/managers/ResizeManager.mjs";

export default class BoostsUI {
  display;

  isShown = false;
  waveNumber = 1;

  fontName = "BerlinSansFBDemi-Bold";
  titleFontSize = 72;
  subtitleFontSize = 38;
  labelFontSize = 28;

  leftContainer;
  centerContainer;
  rightContainer;

  overlay;
  anyTapGoesToStore = false;


  wave1Keys = ["multishot", "fire", "ricochet"];
  wave1Icons = { multishot: "icon_multishot", fire: "icon_fire", ricochet: "icon_ricochet" };
  wave1Base = "boost_base_green";

  wave2Keys = ["shuriken", "meteor", "hammer"];
  wave2Icons = { shuriken: "icon_shuriken", meteor: "icon_meteor", hammer: "icon_hammer" };
  wave2Base = "boost_base_blue";

  constructor(parentLayer = app.overlayLayer) {
    this.display = new Container();
    this.display.visible = false;
    this.display.eventMode = "static";
    parentLayer.addChild(this.display);

    this.createDim();
    this.initBanners();
    this.initTextBanner();
    this.initEvents();

    this.onResize();
  }

  /*──────── overlay ─────────*/
  createDim() {
    this.overlay = new Graphics()
      .beginFill(0x000000, 0.80)
      .drawRect(0, 0, app.width, app.height)
      .endFill();

    this.overlay.eventMode = "static";
    this.overlay.on("pointerdown", (event) => {
      event?.stopPropagation?.();
      if (this.anyTapGoesToStore) {
        let centerKey = this.centerContainer?._key || "meteor";
        this.pick(centerKey);
      }
    });

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

  /*──────── banners ─────────*/
  initBanners() {
    this.centerContainer = this.createBanner(this.wave1Keys[1], this.wave1Icons.fire, this.wave1Base);
    this.leftContainer = this.createBanner(this.wave1Keys[0], this.wave1Icons.multishot, this.wave1Base);
    this.rightContainer = this.createBanner(this.wave1Keys[2], this.wave1Icons.ricochet, this.wave1Base);

    this.display.addChild( this.leftContainer,  this.rightContainer, this.centerContainer,);
  }

  createBanner(key, textureKey, baseTextureKey = "boost_base_green") {
    let container = new Container();
    container.eventMode = "static";
    container.cursor = "pointer";

    let shine = app.pixi.sprite('boost_shine2', {anchor: 0.5})
    shine.scale.set(0.9)
    shine.eventMode = 'none'
    gsap.to( shine.scale, {x: 1, y: 1, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: -1})

    let bannerBase = app.pixi.sprite(baseTextureKey, { anchor: 0.5 });
    let sprite = app.pixi.sprite(textureKey, { anchor: 0.5 });
    sprite.position.set(0, -45);

    let label = new BitmapText(key.toUpperCase(), {
      fontName: this.fontName,
      fontSize: this.labelFontSize,
      align: "center",
    });
    label.anchor.set(0.5);
    label.position.set(0, 105);

    container._base = bannerBase;
    container._icon = sprite;
    container._label = label;
    container._key = key;

    container.addChild(shine, bannerBase, sprite, label);

    container.on("pointerdown", (event) => {
      event?.stopPropagation?.();
      this.pick(container._key);
    });

    return container;
  }

  applyBannerVisuals(container, key, iconTextureKey, baseTextureKey) {
    if (!container) return;
    container._key = key;
    if (container._label) container._label.text = key.toUpperCase();
    if (container._icon) container._icon.texture = app.pixi.texture(iconTextureKey);
    if (container._base) container._base.texture = app.pixi.texture(baseTextureKey);
  }

  setBannersForWave(wave) {
    if (wave >= 2) {
      // синяя база + [shuriken, meteor, hammer]
      this.applyBannerVisuals(this.leftContainer, this.wave2Keys[0], this.wave2Icons.shuriken, this.wave2Base);
      this.applyBannerVisuals(this.centerContainer, this.wave2Keys[1], this.wave2Icons.meteor, this.wave2Base);
      this.applyBannerVisuals(this.rightContainer, this.wave2Keys[2], this.wave2Icons.hammer, this.wave2Base);
    } else {
      // зелёная база + [multishot, fire, ricochet]
      this.applyBannerVisuals(this.leftContainer, this.wave1Keys[0], this.wave1Icons.multishot, this.wave1Base);
      this.applyBannerVisuals(this.centerContainer, this.wave1Keys[1], this.wave1Icons.fire, this.wave1Base);
      this.applyBannerVisuals(this.rightContainer, this.wave1Keys[2], this.wave1Icons.ricochet, this.wave1Base);
    }
  }

  initTextBanner() {
    this.textBannerContainer = new Container();
    this.textBannerContainer.eventMode = "static";

    this.textBanner = app.pixi.sprite("boost_banner", { anchor: 0.5 });

    this.textBannerContainer.addChild(this.textBanner);
    this.display.addChild(this.textBannerContainer);
  }

  /*──────── events ─────────*/
  initEvents() {
    app.eventEmitter.on(app.data.EVENTS.SHOW_BOOSTS, this.onShowBoosts);
    app.eventEmitter.on(app.data.EVENTS.BOOST_TIMEOUT_HINT, this.onHint);
    app.eventEmitter.on(app.data.EVENTS.BOOST_AUTOSELECT, this.onAutoPick);
    app.resize.add(this.onResize);
  }

  destroy() {
    app.eventEmitter.off(app.data.EVENTS.SHOW_BOOSTS, this.onShowBoosts);
    app.eventEmitter.off(app.data.EVENTS.BOOST_TIMEOUT_HINT, this.onHint);
    app.eventEmitter.off(app.data.EVENTS.BOOST_AUTOSELECT, this.onAutoPick);
    app.resize.remove(this.onResize);
    this.display.destroy({ children: true });
  }

  /*──────── handlers ─────────*/
  onResize = () => {

    this.redrawDim();

    // this.shine.position.set(app.width / 2, app.height /2 + 65);

    let mode = app.resize.ratioLess('SM')
      ? 'TABLET'
      : (app.resize.ratioName === RATIO_NAMES.XLG ? 'TALL' : 'DEFAULT');

    switch (mode) {
      case 'TABLET': {
        // 4:3, 16:10, etc.
        if (app.isPortrait) {
          this.textBannerContainer.position.set(app.width / 2, app.height / 2 - 250);
          this.leftContainer.position.set(app.width / 2 - 190, app.height / 2 + 65);
          this.centerContainer.position.set(app.width / 2, app.height / 2 + 65);
          this.rightContainer.position.set(app.width / 2 + 190, app.height / 2 + 65);

          this.textBannerContainer.scale.set(0.7);
          this.leftContainer.scale.set(0.8);
          this.centerContainer.scale.set(0.8);
          this.rightContainer.scale.set(0.8);
        } else {
          this.textBannerContainer.position.set(app.width / 2, app.height / 2 - 195);
          this.leftContainer.position.set(app.width / 2 - 175, app.height / 2 + 70);
          this.centerContainer.position.set(app.width / 2, app.height / 2 + 70);
          this.rightContainer.position.set(app.width / 2 + 175, app.height / 2 + 70);

          this.textBannerContainer.scale.set(0.65);
          this.leftContainer.scale.set(0.7);
          this.centerContainer.scale.set(0.7);
          this.rightContainer.scale.set(0.7);
        }

        break;
      }

      case 'TALL': {
        // Very tall phones (e.g., iPhone 12/14 Pro Max)
        if (app.isPortrait) {
          this.textBannerContainer.position.set(app.width / 2, app.height / 2 - 330);
          this.leftContainer.position.set(app.width / 2 - 200, app.height / 2 + 65);
          this.centerContainer.position.set(app.width / 2, app.height / 2 + 65);
          this.rightContainer.position.set(app.width / 2 + 200, app.height / 2 + 65);

          this.textBannerContainer.scale.set(0.8);
          this.leftContainer.scale.set(0.9);
          this.centerContainer.scale.set(0.9);
          this.rightContainer.scale.set(0.9);
        } else {
          this.textBannerContainer.position.set(app.width / 2, app.height / 2 - 205);
          this.leftContainer.position.set(app.width / 2 - 190, app.height / 2 + 80);
          this.centerContainer.position.set(app.width / 2, app.height / 2 + 80);
          this.rightContainer.position.set(app.width / 2 + 190, app.height / 2 + 80);

          this.textBannerContainer.scale.set(0.75);
          this.leftContainer.scale.set(0.75);
          this.centerContainer.scale.set(0.75);
          this.rightContainer.scale.set(0.75);
        }

        break;
      }

      default: {
        // Default phones / desktop
        if (app.isPortrait) {
          this.textBannerContainer.position.set(app.width / 2, app.height / 2 - 220);
          this.leftContainer.position.set(app.width / 2 - 190, app.height / 2 + 120);
          this.centerContainer.position.set(app.width / 2, app.height / 2 + 120);
          this.rightContainer.position.set(app.width / 2 + 190, app.height / 2 + 120);

          this.textBannerContainer.scale.set(0.8);
          this.leftContainer.scale.set(0.8);
          this.centerContainer.scale.set(0.8);
          this.rightContainer.scale.set(0.8);
        } else {
          this.textBannerContainer.position.set(app.width / 2, app.height / 2 - 205);
          this.leftContainer.position.set(app.width / 2 - 190, app.height / 2 + 80);
          this.centerContainer.position.set(app.width / 2, app.height / 2 + 80);
          this.rightContainer.position.set(app.width / 2 + 190, app.height / 2 + 80);

          this.textBannerContainer.scale.set(0.75);
          this.leftContainer.scale.set(0.75);
          this.centerContainer.scale.set(0.75);
          this.rightContainer.scale.set(0.75);
        }

        break;
      }
    }
  };

  onShowBoosts = ({ wave = 1 } = {}) => {
    this.waveNumber = wave;

    this.setBannersForWave(wave);

    this.anyTapGoesToStore = (wave >= 2);

    this.show();
  };

  onHint = () => {
    if (!this.isShown) return;
  };

  onAutoPick = ({ key } = {}) => {
    if (!this.isShown) return;

    let fallback = this.centerContainer?._key || "fire";
    let safeKey = key || fallback;

    this.pick(safeKey);
  };

  /*──────── api ─────────*/
  show() {
    if (this.isShown) return;
    this.isShown = true;
    this.display.visible = true;
    this.display.alpha = 0;
    gsap.to(this.display, { alpha: 1, duration: 0.18, ease: "sine.out" });
  }

  hide() {
    if (!this.isShown) return;
    this.isShown = false;
    gsap.to(this.display, {
      alpha: 0,
      duration: 0.15,
      ease: "sine.in",
      onComplete: () => {
        if (!this.display) return;
        this.display.visible = false;
        this.display.alpha = 1;
      },
    });
  }

  pick(key) {
    this.hide();
    app.eventEmitter.emit(app.data.EVENTS.BOOST_SELECTED, { key });
  }
}

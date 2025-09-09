export default class ResizeManager {
    #callStack = new Set();

    LANDSCAPE = 'landscape';
    PORTRAIT = 'portrait';    

    screen = {
        get width() { return window.innerWidth },
        get height() { return window.innerHeight }
    }

    constructor() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    add(resizeFunction) {
        resizeFunction({orientation: this.orientation});
        this.#callStack.add(resizeFunction);
    }

    remove(resizeFunction) {
        this.#callStack.delete(resizeFunction);
    }

    onWindowResize() {
        this.#callStack.forEach(resizeFunction => resizeFunction({orientation: this.orientation}));
    }     

    get orientation() {
        return this.screen.width > this.screen.height ? this.LANDSCAPE : this.PORTRAIT;
    }

    get ratio() {
        return this.screen.width / this.screen.height;
    }

    get isPortrait() {        
        return this.screen.width < this.screen.height;
    }

    get landscapeRatio() {        
        return this.ratio < 1 ? 1 / this.ratio : this.ratio;
    }

    get ratioName() {
        for ( let ratioName in RATIO_LIST ) {            
            if ( this.landscapeRatio > RATIO_LIST[ratioName] )
                return ratioName;
        }

        return RATIO_NAMES.EMN;
    }

    ratioLess(ratioName) {
        return this.landscapeRatio < RATIO_LIST[ratioName.toUpperCase()];
    }
}

export const RATIO_NAMES = {
    XLG: 'XLG',
    LG: 'LG',
    MD: 'MD',
    SM: 'SM',
    XSM: 'XSM',
    MN: 'MN',
    EMN: 'EMN'
}

const RATIO_LIST = {
    /* X */
    [RATIO_NAMES.XLG]: 19.5/9 - 0.01,
    /* 16/8 */
    [RATIO_NAMES.LG]: 16/8  - 0.01,
    /* 16/9 */
    [RATIO_NAMES.MD]: 16/9 - 0.01,
    /* 5/3 */
    [RATIO_NAMES.SM]: 5/3 - 0.01,
    /* 16/10 */
    [RATIO_NAMES.XSM]: 16/10 - 0.01,
    /* 3/2 */
    [RATIO_NAMES.MN]: 3/2 - 0.01,
    /* 4/3 */
    [RATIO_NAMES.EMN]: 4/3 - 0.01
};
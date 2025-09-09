import gsap from "gsap-3.12.5";
import Application3D from './src/modules/Application3D.mjs';

console.clear();

/**@type {gsap} */
globalThis.gsap = gsap;

/**@type {Application3D} */
globalThis.app = new Application3D();
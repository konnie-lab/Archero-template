import JSZip from '@progress/jszip-esm';
import { GLTFLoader } from 'three-161/addons/loaders/GLTFLoader.js';

class AssetsManager {
	images = {};
	audios = {};
	models = {};
	sheets = {};
	zips = {};

	#loaders = {
		'png': { storage: this.images, load: this.#loadImage },
		'jpg': { storage: this.images, load: this.#loadImage },
		'mp3': { storage: this.audios, load: this.#loadSound },
		'glb': { storage: this.models, load: this.#loadGLBModel.bind(this) },
		'json': { storage: this.sheets, load: this.#loadJSON },
		'zip': { storage: this.zips, load: this.#loadZIP.bind(this) },
	}

	#loaderGLTF = new GLTFLoader();	   
	#jszip = new JSZip();

	async loadFiles( files, onLoadComplete ) {
		for ( let file of files ) {
			let fileName = file.name;
			let assetName = fileName.split(".")[0];
			let assetExtension = fileName.split(".")[1];			

			let loader = this.#loaders[ assetExtension ];
			if ( !loader ) continue;
			loader.storage[ assetName ] = await loader.load( file.src );
		}

		onLoadComplete();
	}

	#loadImage( path ) {
		return new Promise((resolve, reject) => {
			let image = new Image();
			image.addEventListener('load', () => resolve(image));
			image.addEventListener('error', (err) => reject(err));
			image.src = path;
		});
	}

	#loadSound( path ) {
		return new Promise((resolve, reject) => {
			let audio = new Audio(path);			
			resolve(audio);			
		});
	}

	#loadGLBModel( path ) {
		return new Promise((resolve, reject) => {
			this.#loaderGLTF.load(path, (model) => {				
				resolve(model);
			});
		});
	}

	#loadJSON( path ) {
		return new Promise((resolve, reject) => {
			fetch(path)
			.then((response) => response.json())
			.then((json) => resolve(json));
		});
	}

	#loadZIP( path ) {
		return new Promise( async (resolve, reject) => {
			let zip = await this.#jszip.loadAsync( path, {base64: true} );
				
			for (let fileName in zip.files) {	
				let extension = fileName.split(".")[1];
				let assetName = fileName.split(".")[0];
				let base64 = await zip.files[fileName].async('base64');
				base64 = 'data:application/octet-stream;base64, ' + base64;
				
				let loader = this.#loaders[ extension ];
				if ( !loader ) continue;
				loader.storage[ assetName ] = await loader.load( base64 );				
			}

			resolve();
		})		
	}
}

export default AssetsManager;
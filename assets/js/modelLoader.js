import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

/**
 * Loads a GLB/GLTF model and adds it to the scene.
 * @param {string} path - Path to the .glb file (e.g., 'assets/models/desk.glb')
 * @param {object} options - { pos: [x,y,z], rot: [x,y,z], scale: [x,y,z], parent: scene }
 * @returns {Promise<THREE.Object3D>} - The loaded model object
 */
export function loadModel(path, { pos = [0,0,0], rot = [0,0,0], scale = [1,1,1], parent = null } = {}) {
    return new Promise((resolve, reject) => {
        loader.load(
            path,
            (gltf) => {
                const model = gltf.scene;
                
                // Apply Transforms
                model.position.set(...pos);
                model.rotation.set(...rot);
                model.scale.set(...scale);

                // Enable Shadows
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Add to parent (Scene or Group)
                if (parent) {
                    parent.add(model);
                }

                resolve(model);
            },
            undefined, // Progress callback
            (error) => {
                console.error(`Error loading model ${path}:`, error);
                reject(error);
            }
        );
    });
}

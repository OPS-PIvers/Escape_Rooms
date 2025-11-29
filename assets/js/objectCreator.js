import { generateProceduralObject } from './procedural.js';

/**
 * Creates a procedural object.
 * @param {string} type - The type of object (e.g., 'desk', 'chair', 'plant').
 * @param {object} options - { pos: [x,y,z], rot: [x,y,z], scale: [x,y,z], parent: scene }
 * @returns {Promise<THREE.Object3D>} - The generated object (Promise for compatibility, though currently sync)
 */
export async function createObject(type, { pos = [0,0,0], rot = [0,0,0], scale = [1,1,1], parent = null } = {}) {
    // Normalize type string
    const normalizedType = type.toLowerCase().replace('.glb', '').replace('assets/models/', '');

    const object = generateProceduralObject(normalizedType);

    if (!object) {
        console.warn(`Could not generate object of type: ${type}`);
        return null;
    }

    // Apply Transforms
    object.position.set(...pos);
    object.rotation.set(...rot);
    object.scale.set(...scale);

    // Enable Shadows
    object.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    // Add to parent (Scene or Group)
    if (parent) {
        parent.add(object);
    }

    return object;
}

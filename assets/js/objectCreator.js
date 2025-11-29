import { generateProceduralObject } from './procedural.js';

/**
 * Creates a procedural object.
 * @param {string} type - The type of object (e.g., 'desk', 'chair', 'plant').
 * @param {object} options - { pos: [x,y,z], rot: [x,y,z], scale: [x,y,z], parent: scene }
 * @returns {Promise<THREE.Object3D|null>} - The generated object, or null if creation failed. (Returned as a Promise for async compatibility)
 */
export async function createObject(type, { pos = [0,0,0], rot = [0,0,0], scale = [1,1,1], parent = null } = {}) {
    // Normalize type string: remove paths and extensions, but keep casing/formatting for generator logic if needed
    // Actually, procedural.js handles fuzzy matching, but stripping the path is essential.
    const cleanType = type.replace('assets/models/', '').replace('.glb', '');

    const object = generateProceduralObject(cleanType);

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

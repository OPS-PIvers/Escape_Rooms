import * as THREE from 'three';
import { loadModel } from './modelLoader.js';
import {
    WALL_SIZE,
    WALL_HEIGHT,
    TILE_SCALE,
    ROOM_SIZE
} from './constants.js';

/**
 * Creates a basic room with floor, ceiling, and walls.
 * The room is centered at (0,0,0).
 *
 * @param {THREE.Scene} scene - The scene to add the room to.
 * @param {number} width - Width of the room in wall units (default: ROOM_SIZE).
 * @param {number} length - Length of the room in wall units (default: ROOM_SIZE).
 * @returns {object} - { roomGroup, bounds: { minX, maxX, minZ, maxZ } }
 */
export async function createRoom(scene, width = ROOM_SIZE, length = ROOM_SIZE) {
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    // Calculate dimensions in world units
    const roomWidthWorld = width * WALL_SIZE;
    const roomLengthWorld = length * WALL_SIZE;

    // Center offsets
    const startX = -((width * WALL_SIZE) / 2) + (WALL_SIZE / 2);
    const startZ = -((length * WALL_SIZE) / 2) + (WALL_SIZE / 2);

    const loadPromises = [];

    // --- Floor ---
    for (let x = 0; x < width; x++) {
        for (let z = 0; z < length; z++) {
            const px = startX + x * WALL_SIZE;
            const pz = startZ + z * WALL_SIZE;
            loadPromises.push(loadModel('assets/models/floorFull.glb', {
                pos: [px, 0, pz],
                scale: [TILE_SCALE, TILE_SCALE, TILE_SCALE],
                parent: roomGroup
            }));
        }
    }

    // --- Ceiling ---
    const ceilingGeometry = new THREE.PlaneGeometry(roomWidthWorld, roomLengthWorld);
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_HEIGHT; // Exact height of walls
    roomGroup.add(ceiling);

    // --- Walls ---
    // Helper to place a wall segment
    const placeWall = (model, x, z, rotY) => {
        loadPromises.push(loadModel(model, {
            pos: [x, 0, z],
            rot: [0, rotY, 0],
            scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE],
            parent: roomGroup
        }));
    };

    // Corners
    const cornerOffsetX = roomWidthWorld / 2;
    const cornerOffsetZ = roomLengthWorld / 2;
    const cornerModel = 'assets/models/wallCorner.glb';

    // BL, BR, FL, FR (Back-Left, Back-Right, Front-Left, Front-Right)
    placeWall(cornerModel, -cornerOffsetX, -cornerOffsetZ, 0);            // Back Left
    placeWall(cornerModel, cornerOffsetX, -cornerOffsetZ, -Math.PI / 2); // Back Right
    placeWall(cornerModel, -cornerOffsetX, cornerOffsetZ, Math.PI / 2);  // Front Left
    placeWall(cornerModel, cornerOffsetX, cornerOffsetZ, Math.PI);       // Front Right

    // Back & Front Walls (along X axis)
    for (let i = 0; i < width; i++) {
        const px = startX + i * WALL_SIZE;
        // Back Wall
        placeWall('assets/models/wall.glb', px, -cornerOffsetZ, 0);
        // Front Wall
        placeWall('assets/models/wall.glb', px, cornerOffsetZ, Math.PI);
    }

    // Left & Right Walls (along Z axis)
    for (let i = 0; i < length; i++) {
        const pz = startZ + i * WALL_SIZE;
        // Left Wall
        placeWall('assets/models/wall.glb', -cornerOffsetX, pz, Math.PI / 2);
        // Right Wall
        placeWall('assets/models/wall.glb', cornerOffsetX, pz, -Math.PI / 2);
    }

    // Wait for all models to load so roomGroup is fully populated
    await Promise.all(loadPromises);

    return {
        roomGroup,
        bounds: {
            minX: -cornerOffsetX + 0.5,
            maxX: cornerOffsetX - 0.5,
            minZ: -cornerOffsetZ + 0.5,
            maxZ: cornerOffsetZ - 0.5
        },
        wallPositions: {
            back: -cornerOffsetZ,
            front: cornerOffsetZ,
            left: -cornerOffsetX,
            right: cornerOffsetX
        }
    };
}

/**
 * Places an object into the scene and optionally makes it interactable.
 *
 * @param {THREE.Object3D} parent - The parent object (scene or group).
 * @param {Array} interactables - The array to push interactable meshes into.
 * @param {string} modelPath - Path to the model.
 * @param {object} options - { pos, rot, scale, name, checkCollisions }
 */
export async function placeObject(parent, interactables, modelPath, {
    pos = [0,0,0],
    rot = [0,0,0],
    scale = [1,1,1],
    name = null
} = {}) {
    const model = await loadModel(modelPath, { pos, rot, scale, parent });

    if (name) {
        model.name = name; // Set name on the group

        model.traverse((child) => {
            if (child.isMesh) {
                child.name = name; // Ensure the mesh has the name for raycaster
                interactables.push(child);
            }
        });
    }

    return model;
}

/**
 * Places a child object on top of a parent object.
 *
 * @param {THREE.Object3D} parentObject - The object to place on.
 * @param {THREE.Object3D} childObject - The object to be placed.
 * @param {object} offset - Optional {x, y, z} offset from center of top surface.
 */
export function placeOnSurface(parentObject, childObject, offset = {x:0, y:0, z:0}) {
    // 1. Get Parent World Bounding Box
    const parentBox = new THREE.Box3().setFromObject(parentObject);
    const parentMaxY = parentBox.max.y;

    // 2. Get Child World Bounding Box (assuming it is currently at 0,0,0 or wherever)
    // We need to know the height of the child's bottom relative to its pivot.
    const childBox = new THREE.Box3().setFromObject(childObject);
    const childMinY = childBox.min.y;

    // Shift = parentMaxY - childMinY.
    const shiftY = parentMaxY - childMinY;

    childObject.position.y += shiftY + (offset.y || 0);

    // If offset X/Z is provided, we center on parent then apply offset.
    if (offset.x !== undefined || offset.z !== undefined) {
        const parentCenter = new THREE.Vector3();
        parentBox.getCenter(parentCenter);

        if (offset.x !== undefined) childObject.position.x = parentCenter.x + offset.x;
        if (offset.z !== undefined) childObject.position.z = parentCenter.z + offset.z;
    }
}

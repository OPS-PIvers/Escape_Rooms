import * as THREE from 'three';
import { loadModel } from './modelLoader.js';
import { createDesk } from './prefabs/desk.js';
import { createShelves } from './prefabs/shelves.js';
import { createClock } from './prefabs/clock.js'; // Assuming this exists or handled generally
import { mat } from './materials.js';

// Room Configuration
const ROOM_WIDTH = 8;
const ROOM_DEPTH = 8;
const WALL_HEIGHT = 3;

export async function initClassroom(scene) {
    console.log("Initializing Classroom Scene...");

    // 1. Lighting (Basic setup for visibility)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 2. Floor
    const floor = await loadModel('assets/models/floorFull.glb');
    if (floor) {
        // Tile the floor 4x4
        for (let x = -ROOM_WIDTH / 2; x < ROOM_WIDTH / 2; x += 2) {
            for (let z = -ROOM_DEPTH / 2; z < ROOM_DEPTH / 2; z += 2) {
                const tile = floor.clone();
                tile.position.set(x + 1, 0, z + 1); // Offset to center 2x2 tile
                scene.add(tile);
            }
        }
    }

    // 3. Ceiling (Added for better immersion)
    const ceilingGeometry = new THREE.BoxGeometry(ROOM_WIDTH + 1, 0.5, ROOM_DEPTH + 1);
    const ceilingMaterial = mat.wall || new THREE.MeshStandardMaterial({ color: 0xebe5ce });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(0, WALL_HEIGHT + 0.25, 0);
    scene.add(ceiling);

    // 4. Walls
    const wallModel = await loadModel('assets/models/wall.glb');
    const wallCorner = await loadModel('assets/models/wallCorner.glb');
    const wallWindow = await loadModel('assets/models/wallWindow.glb');
    const doorway = await loadModel('assets/models/doorway.glb');
    
    if (wallModel) {
        // Scaling to 2.0 to match grid of 2.0
        const WALL_SCALE = 2.0;

        // Helper to place walls
        const placeWall = (model, x, z, rotationY) => {
            const wall = model.clone();
            wall.position.set(x, 0, z);
            wall.rotation.y = rotationY;
            wall.scale.set(WALL_SCALE, WALL_SCALE, WALL_SCALE);
            wall.userData.isWall = true; // Mark for boundary detection
            scene.add(wall);
            return wall;
        };

        // Back Wall (Solid)
        for (let x = -3; x <= 3; x += 2) {
            placeWall(wallModel, x, -ROOM_DEPTH / 2, 0);
        }

        // Front Wall (Blackboard/Teacher side)
        for (let x = -3; x <= 3; x += 2) {
            // Leave space for door at x=3
            if (x < 3) placeWall(wallModel, x, ROOM_DEPTH / 2, Math.PI);
        }

        // Left Wall (Windows)
        for (let z = -3; z <= 3; z += 2) {
             placeWall(wallWindow || wallModel, -ROOM_WIDTH / 2, z, Math.PI / 2);
        }

        // Right Wall (Solid)
        for (let z = -3; z <= 3; z += 2) {
            placeWall(wallModel, ROOM_WIDTH / 2, z, -Math.PI / 2);
        }

        // Corners
        if (wallCorner) {
            placeWall(wallCorner, -ROOM_WIDTH/2, -ROOM_DEPTH/2, 0);
            placeWall(wallCorner, ROOM_WIDTH/2, -ROOM_DEPTH/2, -Math.PI/2);
            placeWall(wallCorner, -ROOM_WIDTH/2, ROOM_DEPTH/2, Math.PI/2);
            placeWall(wallCorner, ROOM_WIDTH/2, ROOM_DEPTH/2, Math.PI);
        }
    }

    // 5. Door (Placed specifically to align with wall)
    if (doorway) {
        doorway.position.set(3, 0, ROOM_DEPTH / 2); // Front right corner area
        doorway.rotation.y = Math.PI;
        doorway.scale.set(2.0, 2.0, 2.0); // Scaled to match walls
        scene.add(doorway);
    }

    // 6. Teacher's Area
    const teacherDeskGroup = await createDesk();
    if (teacherDeskGroup) {
        teacherDeskGroup.position.set(0, 0, 2.5);
        teacherDeskGroup.rotation.y = Math.PI; // Facing students
        scene.add(teacherDeskGroup);
    }

    // 7. Student Desks (Grid Layout)
    const startX = -2;
    const startZ = -2;
    const gapX = 2;
    const gapZ = 2;

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const deskGroup = await createDesk();
            if (deskGroup) {
                deskGroup.position.set(startX + (col * gapX), 0, startZ + (row * gapZ));
                // Randomize slight rotation for realism
                deskGroup.rotation.y = (Math.random() - 0.5) * 0.1; 
                scene.add(deskGroup);
            }
        }
    }

    // 8. Shelves at the back
    const shelves = await createShelves();
    if (shelves) {
        shelves.position.set(-2, 0, -ROOM_DEPTH / 2 + 0.5);
        scene.add(shelves);

        const shelves2 = await createShelves();
        shelves2.position.set(2, 0, -ROOM_DEPTH / 2 + 0.5);
        scene.add(shelves2);
    }

    // 9. Clock
    // If createClock exists, use it, otherwise simple placement
    try {
        if (typeof createClock === 'function') {
            createClock(scene, new THREE.Vector3(0, 2.5, -ROOM_DEPTH/2 + 0.1));
        }
    } catch (e) {
        console.warn("Clock prefab not available");
    }

    console.log("Classroom Scene Loaded");
}

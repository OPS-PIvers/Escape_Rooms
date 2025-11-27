import * as THREE from 'three';
import { loadModel } from './modelLoader.js';
import { createDesk } from './prefabs/desk.js';
import { createShelves } from './prefabs/shelves.js';
import { createClock } from './prefabs/clock.js'; // Assuming this exists or handled generally
import { WALL_HEIGHT } from './constants.js';

// Room Configuration
const ROOM_WIDTH = 8;
const ROOM_DEPTH = 8;

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
        // Tile the floor with step 1 to avoid gaps
        for (let x = -ROOM_WIDTH / 2; x < ROOM_WIDTH / 2; x += 1) {
            for (let z = -ROOM_DEPTH / 2; z < ROOM_DEPTH / 2; z += 1) {
                const tile = floor.clone();
                tile.position.set(x + 0.5, 0, z + 0.5); // Center 0.5, 0.5 for range [0, 1] relative to grid
                scene.add(tile);
            }
        }
    }

    // 3. Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(ROOM_WIDTH + 0.1, ROOM_DEPTH + 0.1); // Slightly larger to avoid gaps
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_HEIGHT;
    scene.add(ceiling);

    // 4. Walls
    const wallModel = await loadModel('assets/models/wall.glb');
    const wallCorner = await loadModel('assets/models/wallCorner.glb');
    const wallWindow = await loadModel('assets/models/wallWindow.glb');
    const doorway = await loadModel('assets/models/doorway.glb');
    
    if (wallModel) {
        // Helper to place walls
        const placeWall = (model, x, z, rotationY) => {
            const wall = model.clone();
            wall.position.set(x, 0, z);
            wall.scale.y = WALL_HEIGHT;
            wall.rotation.y = rotationY;
            wall.userData.isWall = true; // Mark for boundary detection
            scene.add(wall);
            return wall;
        };

        // Walls - Step 1 to fill gaps. Range [-ROOM/2, ROOM/2] roughly.
        // Wall centers at half integers?
        // Width 8. Range [-4, 4].
        // Wall centers: -3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5.
        // Loop range [-3.5, 3.5].

        const start = -ROOM_WIDTH/2 + 0.5; // -3.5
        const end = ROOM_WIDTH/2 - 0.5; // 3.5

        // Back Wall (Solid)
        for (let x = start; x <= end; x += 1) {
            placeWall(wallModel, x, -ROOM_DEPTH / 2, 0);
        }

        // Front Wall (Blackboard/Teacher side)
        for (let x = start; x <= end; x += 1) {
            // Leave space for door at x=3.5 (far right)
            if (Math.abs(x - 3.5) > 0.1) placeWall(wallModel, x, ROOM_DEPTH / 2, Math.PI);
        }

        // Left Wall (Windows)
        for (let z = start; z <= end; z += 1) {
             placeWall(wallWindow || wallModel, -ROOM_WIDTH / 2, z, Math.PI / 2);
        }

        // Right Wall (Solid)
        for (let z = start; z <= end; z += 1) {
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
        doorway.position.set(3.5, 0, ROOM_DEPTH / 2); // Front right corner area (align with missing wall at 3.5)
        doorway.rotation.y = Math.PI;
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

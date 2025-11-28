// Classroom Escape Room - Uses RoomEngine foundation
import * as THREE from 'three';
import { RoomEngine } from './roomEngine.js';
import { loadModel } from './modelLoader.js';
import { createDesk } from './prefabs/desk.js';
import { createShelves } from './prefabs/shelves.js';
import { createClock } from './prefabs/clock.js';
import { showModal } from './ui.js';
import { initGame } from './gameLogic.js';
import {
    WALL_HEIGHT,
    CLASSROOM_WIDTH,
    CLASSROOM_DEPTH,
    CLASSROOM_DESK_START_X,
    CLASSROOM_DESK_START_Z,
    CLASSROOM_DESK_GAP_X,
    CLASSROOM_DESK_GAP_Z,
    WALL_MOUNT_HEIGHT
} from './constants.js';

// Build the classroom scene content
async function buildClassroomScene(engine) {
    const scene = engine.scene;

    // 1. Floor
    const floor = await loadModel('assets/models/floorFull.glb');
    if (floor) {
        for (let x = -CLASSROOM_WIDTH / 2; x < CLASSROOM_WIDTH / 2; x += 1) {
            for (let z = -CLASSROOM_DEPTH / 2; z < CLASSROOM_DEPTH / 2; z += 1) {
                const tile = floor.clone();
                tile.position.set(x + 0.5, 0, z + 0.5);
                scene.add(tile);
            }
        }
    }

    // 2. Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(CLASSROOM_WIDTH + 0.1, CLASSROOM_DEPTH + 0.1);
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_HEIGHT;
    scene.add(ceiling);

    // 3. Walls
    const wallModel = await loadModel('assets/models/wall.glb');
    const wallCorner = await loadModel('assets/models/wallCorner.glb');
    const wallWindow = await loadModel('assets/models/wallWindow.glb');
    const doorway = await loadModel('assets/models/doorway.glb');

    if (wallModel) {
        const placeWall = (model, x, z, rotationY) => {
            const wall = model.clone();
            wall.position.set(x, 0, z);
            wall.scale.y = WALL_HEIGHT;
            wall.rotation.y = rotationY;
            wall.userData.isWall = true;
            scene.add(wall);
            return wall;
        };

        const start = -CLASSROOM_WIDTH/2 + 0.5;
        const end = CLASSROOM_WIDTH/2 - 0.5;
        const doorX = (CLASSROOM_WIDTH / 2) - 0.5;

        // Back Wall (Solid)
        for (let x = start; x <= end; x += 1) {
            placeWall(wallModel, x, -CLASSROOM_DEPTH / 2, 0);
        }

        // Front Wall (Blackboard/Teacher side)
        for (let x = start; x <= end; x += 1) {
            if (Math.abs(x - doorX) > 0.1) placeWall(wallModel, x, CLASSROOM_DEPTH / 2, Math.PI);
        }

        // Left Wall (Windows)
        for (let z = start; z <= end; z += 1) {
            placeWall(wallWindow || wallModel, -CLASSROOM_WIDTH / 2, z, Math.PI / 2);
        }

        // Right Wall (Solid)
        for (let z = start; z <= end; z += 1) {
            placeWall(wallModel, CLASSROOM_WIDTH / 2, z, -Math.PI / 2);
        }

        // Corners
        if (wallCorner) {
            placeWall(wallCorner, -CLASSROOM_WIDTH/2, -CLASSROOM_DEPTH/2, 0);
            placeWall(wallCorner, -CLASSROOM_WIDTH/2, -CLASSROOM_DEPTH/2, -Math.PI/2);
            placeWall(wallCorner, CLASSROOM_WIDTH/2, -CLASSROOM_DEPTH/2, -Math.PI/2);
            placeWall(wallCorner, CLASSROOM_WIDTH/2, -CLASSROOM_DEPTH/2, Math.PI);
            placeWall(wallCorner, -CLASSROOM_WIDTH/2, CLASSROOM_DEPTH/2, Math.PI/2);
            placeWall(wallCorner, -CLASSROOM_WIDTH/2, CLASSROOM_DEPTH/2, 0);
            placeWall(wallCorner, CLASSROOM_WIDTH/2, CLASSROOM_DEPTH/2, Math.PI);
            placeWall(wallCorner, CLASSROOM_WIDTH/2, CLASSROOM_DEPTH/2, Math.PI/2);
        }

        // 4. Door (Placed specifically to align with wall)
        if (doorway) {
            doorway.position.set(doorX, 0, CLASSROOM_DEPTH / 2);
            doorway.rotation.y = Math.PI;
            scene.add(doorway);
        }
    }

    // 5. Teacher's Area
    const teacherDeskGroup = await createDesk();
    if (teacherDeskGroup) {
        teacherDeskGroup.position.set(0, 0, CLASSROOM_DEPTH/2 - 1.5);
        teacherDeskGroup.rotation.y = Math.PI;
        scene.add(teacherDeskGroup);
    }

    // 6. Student Desks (Grid Layout)
    const startX = CLASSROOM_DESK_START_X;
    const startZ = CLASSROOM_DESK_START_Z;
    const gapX = CLASSROOM_DESK_GAP_X;
    const gapZ = CLASSROOM_DESK_GAP_Z;

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const deskGroup = await createDesk();
            if (deskGroup) {
                deskGroup.position.set(startX + (col * gapX), 0, startZ + (row * gapZ));
                deskGroup.rotation.y = (Math.random() - 0.5) * 0.1;
                scene.add(deskGroup);
            }
        }
    }

    // 7. Shelves at the back
    const shelves = await createShelves();
    if (shelves) {
        shelves.position.set(-2, 0, -CLASSROOM_DEPTH / 2 + 0.5);
        scene.add(shelves);

        const shelves2 = await createShelves();
        shelves2.position.set(2, 0, -CLASSROOM_DEPTH / 2 + 0.5);
        scene.add(shelves2);
    }

    // 8. Clock
    try {
        if (typeof createClock === 'function') {
            createClock(scene, new THREE.Vector3(0, WALL_MOUNT_HEIGHT, -CLASSROOM_DEPTH/2 + 0.1));
        }
    } catch (e) {
        console.warn("Clock prefab not available");
    }

    console.log("Classroom Scene Loaded - " + engine.interactables.length + " interactable objects");
}

// Initialize the classroom room
async function initClassroom() {
    // Create engine with classroom-specific config
    const engine = new RoomEngine({
        roomWidth: CLASSROOM_WIDTH,
        roomDepth: CLASSROOM_DEPTH,
        enableProceduralRoom: false, // We'll build our own scene
        enableDoor: false, // Classroom doesn't use the template door (yet)
        enableTimer: false, // Classroom doesn't use timer (yet)
        cameraX: 0,
        cameraZ: 3.5,
        onInteract: (name, obj) => {
            // Handle game-specific interactions
            showModal(name, {});
        }
    });

    // Build the classroom scene
    await buildClassroomScene(engine);

    // Initialize game logic
    initGame();

    // Start the engine
    engine.start();

    // Expose for debugging
    window.engine = engine;
}

// Start the game
initClassroom();

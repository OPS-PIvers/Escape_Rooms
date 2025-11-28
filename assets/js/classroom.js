// Classroom Escape Room - Rebuilt from template with RoomEngine
console.log("classroom.js loaded");

import * as THREE from 'three';
import { RoomEngine } from './roomEngine.js';
import { loadModel } from './modelLoader.js';
import { showModal } from './ui.js';
import { initGame } from './gameLogic.js';
import { WALL_HEIGHT } from './constants.js';

// Room Configuration
const CLASSROOM_WIDTH = 12;
const CLASSROOM_DEPTH = 12;
const WALL_THICKNESS = 0.5;

// Materials
const materials = {
    wall: new THREE.MeshStandardMaterial({ color: 0xe8d4b0, roughness: 0.9 }), // Warm beige
    floor: new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 }), // Wood floor
    ceiling: new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 }), // Off-white
    chalkboard: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 })
};

// Build the classroom scene
async function buildClassroomScene(engine) {
    const scene = engine.scene;
    const halfWidth = CLASSROOM_WIDTH / 2;
    const halfDepth = CLASSROOM_DEPTH / 2;

    // ===== ROOM STRUCTURE (Procedural) =====

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(CLASSROOM_WIDTH, CLASSROOM_DEPTH),
        materials.floor
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(CLASSROOM_WIDTH, CLASSROOM_DEPTH),
        materials.ceiling
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_HEIGHT;
    scene.add(ceiling);

    // Walls (3 solid walls + north wall with door opening)
    const walls = [
        // Front wall (South) - Solid
        { width: CLASSROOM_WIDTH, pos: [0, WALL_HEIGHT/2, halfDepth] },
        // Left wall (West) - Solid
        { width: CLASSROOM_DEPTH, pos: [-halfWidth, WALL_HEIGHT/2, 0], rotY: Math.PI/2 },
        // Right wall (East) - Solid
        { width: CLASSROOM_DEPTH, pos: [halfWidth, WALL_HEIGHT/2, 0], rotY: Math.PI/2 }
    ];

    walls.forEach(wall => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(wall.width, WALL_HEIGHT, WALL_THICKNESS),
            materials.wall
        );
        mesh.position.set(...wall.pos);
        if (wall.rotY) mesh.rotation.y = wall.rotY;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
    });

    // North wall (Back) - With door opening (3 pieces: left, right, lintel)
    const doorW = 1.2;
    const doorH = 2.2;
    const sideWidth = (CLASSROOM_WIDTH - doorW) / 2;
    const lintelHeight = WALL_HEIGHT - doorH;

    // Left piece of north wall
    const wallLeft = new THREE.Mesh(
        new THREE.BoxGeometry(sideWidth, WALL_HEIGHT, WALL_THICKNESS),
        materials.wall
    );
    wallLeft.position.set(-(doorW/2 + sideWidth/2), WALL_HEIGHT/2, -halfDepth);
    wallLeft.castShadow = true;
    wallLeft.receiveShadow = true;
    scene.add(wallLeft);

    // Right piece of north wall
    const wallRight = new THREE.Mesh(
        new THREE.BoxGeometry(sideWidth, WALL_HEIGHT, WALL_THICKNESS),
        materials.wall
    );
    wallRight.position.set((doorW/2 + sideWidth/2), WALL_HEIGHT/2, -halfDepth);
    wallRight.castShadow = true;
    wallRight.receiveShadow = true;
    scene.add(wallRight);

    // Lintel above door
    const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(doorW, lintelHeight, WALL_THICKNESS),
        materials.wall
    );
    lintel.position.set(0, doorH + lintelHeight/2, -halfDepth);
    lintel.castShadow = true;
    lintel.receiveShadow = true;
    scene.add(lintel);

    // ===== OBJECTS CLEARED - Add objects here one at a time =====

    // Example:
    // const desk = await loadModel('assets/models/desk.glb');
    // if (desk) {
    //     desk.position.set(-3, 0, halfDepth - 1.5);
    //     desk.rotation.y = Math.PI;
    //     desk.name = "teacher_desk";
    //     engine.interactables.push(desk);
    //     scene.add(desk);
    // }

    console.log(`Classroom loaded: ${engine.interactables.length} interactable objects`);
}

// Initialize the classroom
async function initClassroom() {
    const engine = new RoomEngine({
        roomWidth: CLASSROOM_WIDTH,
        roomDepth: CLASSROOM_DEPTH,
        wallThickness: WALL_THICKNESS,
        enableProceduralRoom: false, // We build our own
        enableDoor: true,             // Use RoomEngine door
        enableTimer: true,            // Use RoomEngine timer
        cameraX: 0,
        cameraZ: 3,
        onInteract: (name, obj) => {
            // Handle interactions via game logic
            showModal(name, {});
        }
    });

    // Build the classroom scene
    await buildClassroomScene(engine);

    // Create door and timer (since we're not using procedural room)
    engine.createDoor();
    engine.createTimer();

    // Initialize game logic (puzzles, clues, etc.)
    initGame();

    // Start the engine
    engine.start();

    // Expose for debugging
    window.engine = engine;
}

// Start
initClassroom();

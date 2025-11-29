// Office Escape Room - Rebuilt from template with RoomEngine
console.log("office.js loaded");

import * as THREE from 'three';
import { RoomEngine } from './roomEngine.js';
import { createObject } from './objectCreator.js';
import { showModal } from './ui.js';
import { initGame } from './gameLogic.js';
import { WALL_HEIGHT, DESK_SURFACE_Y } from './constants.js';
import { createDesk } from './prefabs/desk.js';

// Room Configuration
const OFFICE_WIDTH = 12;
const OFFICE_DEPTH = 12;
const WALL_THICKNESS = 0.5;

// Materials
const materials = {
    wall: new THREE.MeshStandardMaterial({ color: 0xd4c5a9, roughness: 0.9 }), // Tan
    floor: new THREE.MeshStandardMaterial({ color: 0x3d2f1f, roughness: 0.7 }), // Dark wood
    ceiling: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.9 }), // White
    safe: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.3 })
};

// Build the office scene
async function buildOfficeScene(engine) {
    const scene = engine.scene;
    const halfWidth = OFFICE_WIDTH / 2;
    const halfDepth = OFFICE_DEPTH / 2;

    // ===== ROOM STRUCTURE (Procedural) =====

    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(OFFICE_WIDTH, OFFICE_DEPTH),
        materials.floor
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(OFFICE_WIDTH, OFFICE_DEPTH),
        materials.ceiling
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_HEIGHT;
    scene.add(ceiling);

    // Walls (3 solid walls + north wall with door opening)
    const walls = [
        // Front wall (South) - Solid
        { width: OFFICE_WIDTH, pos: [0, WALL_HEIGHT/2, halfDepth] },
        // Left wall (West) - Solid
        { width: OFFICE_DEPTH, pos: [-halfWidth, WALL_HEIGHT/2, 0], rotY: Math.PI/2 },
        // Right wall (East) - Solid
        { width: OFFICE_DEPTH, pos: [halfWidth, WALL_HEIGHT/2, 0], rotY: Math.PI/2 }
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
    const sideWidth = (OFFICE_WIDTH - doorW) / 2;
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

    // ===== OBJECTS =====

    // Desk Group
    const deskGroup = await createDesk();
    if (deskGroup) {
        deskGroup.position.set(-halfWidth + 2, 0, -halfDepth + 2);
        deskGroup.rotation.y = Math.PI / 4;
        scene.add(deskGroup);
    }

    // Standalone Chair
    const chair = await createObject('chair');
    if (chair) {
        chair.position.set(halfWidth - 2, 0, halfDepth - 2);
        chair.rotation.y = -Math.PI / 4;
        scene.add(chair);
    }

    // Standalone Plant
    const plant = await createObject('plantSmall1');
    if (plant) {
        plant.position.set(halfWidth - 1, 0, -halfDepth + 1);
        scene.add(plant);
    }

    console.log(`Office loaded: ${engine.interactables.length} interactable objects`);
}

// Initialize the office
async function initOffice() {
    const engine = new RoomEngine({
        roomWidth: OFFICE_WIDTH,
        roomDepth: OFFICE_DEPTH,
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

    // Build the office scene
    await buildOfficeScene(engine);

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
initOffice();

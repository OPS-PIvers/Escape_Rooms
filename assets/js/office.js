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

    // --- Zone 1: Desk Area (North-East) ---
    const deskX = 3.5;
    const deskZ = -3.5;
    const deskRot = -Math.PI / 4;

    const desk = await createObject('desk');
    if (desk) {
        desk.position.set(deskX, 0, deskZ);
        desk.rotation.y = deskRot;
        scene.add(desk);
    }

    // Chair (pushed in)
    const deskChair = await createObject('chair');
    if (deskChair) {
        // Position relative to desk, then rotate
        const offset = new THREE.Vector3(0, 0, 0.6); // Behind desk
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), deskRot);
        deskChair.position.set(deskX + offset.x, 0, deskZ + offset.z);
        deskChair.rotation.y = deskRot + Math.PI; // Face desk
        scene.add(deskChair);
    }

    // Desk Lamp
    const lamp = await createObject('lampRoundTable');
    if (lamp) {
        const offset = new THREE.Vector3(-0.6, DESK_SURFACE_Y, -0.2);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), deskRot);
        lamp.position.set(deskX + offset.x, DESK_SURFACE_Y, deskZ + offset.z);
        scene.add(lamp);
    }

    // Laptop
    const laptop = await createObject('laptop');
    if (laptop) {
        const offset = new THREE.Vector3(0, DESK_SURFACE_Y, 0);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), deskRot);
        laptop.position.set(deskX + offset.x, DESK_SURFACE_Y + 0.005, deskZ + offset.z);
        laptop.rotation.y = deskRot + Math.PI; // Face user
        scene.add(laptop);
    }

    // Papers
    const papers = await createObject('paper');
    if (papers) {
        const offset = new THREE.Vector3(0.5, DESK_SURFACE_Y + 0.015, 0.1);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), deskRot);
        papers.position.set(deskX + offset.x, DESK_SURFACE_Y + 0.01, deskZ + offset.z);
        papers.rotation.y = deskRot + 0.1;
        scene.add(papers);
    }

    // --- Zone 2: Lounge Area (South-East) ---
    const loungeX = 3.5;
    const loungeZ = 3.5;

    // Couch
    const couch = await createObject('loungesofa');
    if (couch) {
        couch.position.set(loungeX, 0, loungeZ);
        couch.rotation.y = -Math.PI / 2; // Face West
        scene.add(couch);
    }

    // Coffee Table
    const coffeeTable = await createObject('coffeetable');
    if (coffeeTable) {
        coffeeTable.position.set(loungeX - 1.5, 0, loungeZ);
        scene.add(coffeeTable);

        // Mug on table
        const mug = await createObject('mug');
        if (mug) {
            mug.position.set(loungeX - 1.5, 0.4, loungeZ - 0.2);
            scene.add(mug);
        }

        // Magazines
        const mags = await createObject('magazines');
        if (mags) {
            mags.position.set(loungeX - 1.5, 0.4, loungeZ + 0.2);
            mags.rotation.y = 0.5;
            scene.add(mags);
        }
    }

    // Living Room Chair
    const armChair = await createObject('chair');
    if (armChair) {
        armChair.position.set(loungeX - 3.0, 0, loungeZ);
        armChair.rotation.y = Math.PI / 2; // Face East
        scene.add(armChair);
    }

    // --- Zone 3: Library (West Wall) ---
    const shelfX = -halfWidth + 0.4;
    const shelfStartZ = -halfDepth + 0.8;
    const shelfSpacing = 0.85;
    const numShelves = Math.floor((OFFICE_DEPTH - 1.6) / shelfSpacing);

    for (let i = 0; i < numShelves; i++) {
        const shelf = await createObject('bookcaseopen');
        if (shelf) {
            const z = shelfStartZ + i * shelfSpacing;
            shelf.position.set(shelfX, 0, z);
            shelf.rotation.y = Math.PI / 2;
            scene.add(shelf);

            // Add books and decorations
            const heights = [0.05, 0.45, 0.85, 1.25, 1.65];
            for (const h of heights) {
                if (Math.random() > 0.3) {
                    const books = await createObject('books');
                    if (books) {
                         books.position.set(shelfX, h, z);
                         books.rotation.y = Math.PI / 2;
                         scene.add(books);
                    }
                } else if (Math.random() > 0.5) {
                    const type = Math.random() > 0.6 ? 'plantSmall1' : (Math.random() > 0.5 ? 'radio' : 'pictureframe');
                    const deco = await createObject(type);
                    if (deco) {
                         deco.position.set(shelfX, h, z);
                         deco.rotation.y = Math.PI / 2;
                         if (type === 'pictureframe') deco.scale.set(0.5, 0.5, 0.5);
                         scene.add(deco);
                    }
                }
            }
        }
    }

    // --- Zone 4: Meeting Table (Center/North-West) ---
    const tableX = -1;
    const tableZ = 0;

    const meetingTable = await createObject('meetingtable');
    if (meetingTable) {
        meetingTable.position.set(tableX, 0, tableZ);
        scene.add(meetingTable);

        // Scattered papers
        for (let k=0; k<5; k++) {
             const p = await createObject('paper');
             if (p) {
                 p.position.set(tableX + (Math.random()-0.5)*1.5, 0.74, tableZ + (Math.random()-0.5)*0.8);
                 p.rotation.y = Math.random() * Math.PI;
                 scene.add(p);
             }
        }
    }

    // 4 Chairs around table
    const chairOffsets = [
        { x: 0, z: -0.8, r: 0 },
        { x: 0, z: 0.8, r: Math.PI },
        { x: -1.2, z: 0, r: -Math.PI/2 },
        { x: 1.2, z: 0, r: Math.PI/2 }
    ];
    for (const off of chairOffsets) {
        const c = await createObject('chair');
        if (c) {
            c.position.set(tableX + off.x, 0, tableZ + off.z);
            c.rotation.y = off.r;
            scene.add(c);
        }
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

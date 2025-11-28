// Office Escape Room - Rebuilt from template with RoomEngine
console.log("office.js loaded");

import * as THREE from 'three';
import { RoomEngine } from './roomEngine.js';
import { loadModel } from './modelLoader.js';
import { showModal } from './ui.js';
import { initGame } from './gameLogic.js';
import { WALL_HEIGHT, DESK_SURFACE_Y } from './constants.js';

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

    // Walls (4 solid walls - door is handled by RoomEngine)
    const walls = [
        // Back wall (North)
        { width: OFFICE_WIDTH, pos: [0, WALL_HEIGHT/2, -halfDepth] },
        // Front wall (South)
        { width: OFFICE_WIDTH, pos: [0, WALL_HEIGHT/2, halfDepth] },
        // Left wall (West)
        { width: OFFICE_DEPTH, pos: [-halfWidth, WALL_HEIGHT/2, 0], rotY: Math.PI/2 },
        // Right wall (East)
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

    // ===== EXECUTIVE DESK AREA (Back Left) =====

    const desk = await loadModel('assets/models/desk.glb');
    if (desk) {
        desk.position.set(-halfWidth + 1.5, 0, -halfDepth + 1.5);
        desk.name = "desk";
        engine.interactables.push(desk);
        scene.add(desk);
    }

    const chair = await loadModel('assets/models/chairDesk.glb');
    if (chair) {
        chair.position.set(-halfWidth + 1.5, 0, -halfDepth + 2.5);
        chair.rotation.y = Math.PI;
        scene.add(chair);
    }

    // Computer setup
    const computer = await loadModel('assets/models/computerScreen.glb');
    if (computer) {
        computer.position.set(-halfWidth + 1.5, DESK_SURFACE_Y, -halfDepth + 1.3);
        computer.name = "computer";
        engine.interactables.push(computer);
        scene.add(computer);
    }

    const keyboard = await loadModel('assets/models/computerKeyboard.glb');
    if (keyboard) {
        keyboard.position.set(-halfWidth + 1.5, DESK_SURFACE_Y, -halfDepth + 1.7);
        keyboard.name = "keyboard";
        engine.interactables.push(keyboard);
        scene.add(keyboard);
    }

    const mouse = await loadModel('assets/models/computerMouse.glb');
    if (mouse) {
        mouse.position.set(-halfWidth + 2, DESK_SURFACE_Y, -halfDepth + 1.7);
        mouse.name = "mouse";
        engine.interactables.push(mouse);
        scene.add(mouse);
    }

    const deskLamp = await loadModel('assets/models/lampSquareTable.glb');
    if (deskLamp) {
        deskLamp.position.set(-halfWidth + 0.8, DESK_SURFACE_Y, -halfDepth + 1.5);
        scene.add(deskLamp);
    }

    // ===== FILING CABINETS (Back Wall Center) =====

    const cabinetPositions = [-1, 0, 1];
    for (let i = 0; i < cabinetPositions.length; i++) {
        const cabinet = await loadModel('assets/models/kitchenCabinetDrawer.glb');
        if (cabinet) {
            cabinet.position.set(cabinetPositions[i], 0, -halfDepth + 0.3);
            cabinet.name = `filing_cabinet_${i + 1}`;
            engine.interactables.push(cabinet);
            scene.add(cabinet);
        }
    }

    // ===== BOOKSHELF (Right Wall) =====

    const bookshelf = await loadModel('assets/models/bookcaseOpen.glb');
    if (bookshelf) {
        bookshelf.position.set(halfWidth - 0.5, 0, -halfDepth + 2);
        bookshelf.rotation.y = -Math.PI / 2;
        scene.add(bookshelf);
    }

    // Books on shelves (staggered heights)
    const bookHeights = [0.5, 1.0, 1.5, 2.0];
    for (let i = 0; i < bookHeights.length; i++) {
        const books = await loadModel('assets/models/books.glb');
        if (books) {
            books.position.set(halfWidth - 0.3, bookHeights[i], -halfDepth + 2);
            books.rotation.y = Math.random() * 0.5 - 0.25;
            books.name = `book_cluster_${i + 1}`;
            engine.interactables.push(books);
            scene.add(books);
        }
    }

    // ===== LOUNGE AREA (Front Left) =====

    const sofa = await loadModel('assets/models/loungeSofa.glb');
    if (sofa) {
        sofa.position.set(-halfWidth + 2, 0, halfDepth - 1.5);
        scene.add(sofa);
    }

    const coffeeTable = await loadModel('assets/models/tableCoffeeGlass.glb');
    if (coffeeTable) {
        coffeeTable.position.set(-halfWidth + 2, 0, halfDepth - 3);
        scene.add(coffeeTable);
    }

    // Briefcase on coffee table
    const briefcase = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.15, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.5 })
    );
    briefcase.position.set(-halfWidth + 2.2, 0.3, halfDepth - 3);
    briefcase.rotation.y = 0.3;
    briefcase.name = "briefcase";
    engine.interactables.push(briefcase);
    scene.add(briefcase);

    const floorLamp = await loadModel('assets/models/lampRoundFloor.glb');
    if (floorLamp) {
        floorLamp.position.set(-halfWidth + 0.7, 0, halfDepth - 1.5);
        scene.add(floorLamp);
    }

    // ===== SAFE (Back Right Corner) =====

    const safeGroup = new THREE.Group();
    safeGroup.position.set(halfWidth - 1, 0.5, -halfDepth + 1);
    safeGroup.rotation.y = -Math.PI / 4;

    const safeBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.0, 0.8),
        materials.safe
    );
    safeBox.name = "safe";
    safeBox.castShadow = true;
    engine.interactables.push(safeBox);
    safeGroup.add(safeBox);

    // Safe door (front face)
    const safeDoor = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.9, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    safeDoor.position.set(0, 0, 0.41);
    safeBox.add(safeDoor);

    // Safe dial
    const safeDial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 })
    );
    safeDial.rotation.x = Math.PI / 2;
    safeDial.position.set(0, 0.2, 0.45);
    safeBox.add(safeDial);

    // Safe handle
    const safeHandle = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.2, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 })
    );
    safeHandle.position.set(0.2, 0, 0.45);
    safeBox.add(safeHandle);

    scene.add(safeGroup);

    // ===== DECORATIONS & PROPS =====

    // Globe on filing cabinet
    const globeGroup = new THREE.Group();
    globeGroup.position.set(0, 0.95, -halfDepth + 0.3);

    const globeBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    globeGroup.add(globeBase);

    const globe = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0x4682B4, roughness: 0.6 })
    );
    globe.position.y = 0.25;
    globe.name = "globe";
    engine.interactables.push(globe);
    globeGroup.add(globe);
    scene.add(globeGroup);

    // Clock on back wall
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0, 2.2, -halfDepth + 0.1);

    const clockFrame = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    clockFrame.rotation.x = Math.PI / 2;
    clockGroup.add(clockFrame);

    const clockFace = new THREE.Mesh(
        new THREE.CircleGeometry(0.28, 32),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    clockFace.position.z = 0.051;
    clockFace.name = "clock";
    engine.interactables.push(clockFace);
    clockGroup.add(clockFace);
    scene.add(clockGroup);

    // Plants
    const plant1 = await loadModel('assets/models/pottedPlant.glb');
    if (plant1) {
        plant1.position.set(-halfWidth + 0.5, 0, -halfDepth + 0.5);
        plant1.name = "plant";
        engine.interactables.push(plant1);
        scene.add(plant1);
    }

    const plant2 = await loadModel('assets/models/plantSmall1.glb');
    if (plant2) {
        plant2.position.set(halfWidth - 1, 0, halfDepth - 1);
        scene.add(plant2);
    }

    // Trash can
    const trash = await loadModel('assets/models/trashcan.glb');
    if (trash) {
        trash.position.set(-halfWidth + 0.7, 0, -halfDepth + 2);
        trash.name = "trash";
        engine.interactables.push(trash);
        scene.add(trash);
    }

    // Coat rack
    const coatRack = await loadModel('assets/models/coatRackStanding.glb');
    if (coatRack) {
        coatRack.position.set(-halfWidth + 0.5, 0, -halfDepth + 1.5);
        scene.add(coatRack);
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

    // Initialize game logic (puzzles, clues, etc.)
    initGame();

    // Start the engine
    engine.start();

    // Expose for debugging
    window.engine = engine;
}

// Start
initOffice();

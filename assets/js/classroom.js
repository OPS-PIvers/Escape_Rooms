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

    // Walls (4 solid walls - door is handled by RoomEngine)
    const walls = [
        // Back wall (North)
        { width: CLASSROOM_WIDTH, pos: [0, WALL_HEIGHT/2, -halfDepth] },
        // Front wall (South)
        { width: CLASSROOM_WIDTH, pos: [0, WALL_HEIGHT/2, halfDepth] },
        // Left wall (West)
        { width: CLASSROOM_DEPTH, pos: [-halfWidth, WALL_HEIGHT/2, 0], rotY: Math.PI/2 },
        // Right wall (East)
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

    // ===== CLASSROOM FEATURES =====

    // Chalkboard on front wall
    const chalkboard = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2, 0.1),
        materials.chalkboard
    );
    chalkboard.position.set(0, 1.5, halfDepth - 0.3);
    chalkboard.name = "chalkboard";
    engine.interactables.push(chalkboard);
    scene.add(chalkboard);

    // ===== FURNITURE & PROPS (Using GLB models) =====

    // Teacher's desk at front
    const teacherDesk = await loadModel('assets/models/desk.glb');
    if (teacherDesk) {
        teacherDesk.position.set(-3, 0, halfDepth - 1.5);
        teacherDesk.rotation.y = Math.PI;
        teacherDesk.name = "teacher_desk";
        engine.interactables.push(teacherDesk);
        scene.add(teacherDesk);
    }

    // Student desks (3x3 grid)
    const deskPositions = [
        [-3, 0, 1], [0, 0, 1], [3, 0, 1],
        [-3, 0, -1], [0, 0, -1], [3, 0, -1],
        [-3, 0, -3], [0, 0, -3], [3, 0, -3]
    ];

    for (let i = 0; i < deskPositions.length; i++) {
        const desk = await loadModel('assets/models/desk.glb');
        if (desk) {
            desk.position.set(...deskPositions[i]);
            desk.rotation.y = Math.PI;
            desk.name = `student_desk_${i + 1}`;
            engine.interactables.push(desk);
            scene.add(desk);
        }
    }

    // Bookshelf at back
    const bookshelf = await loadModel('assets/models/bookcaseOpen.glb');
    if (bookshelf) {
        bookshelf.position.set(-4, 0, -halfDepth + 0.5);
        scene.add(bookshelf);
    }

    // Books on shelf (interactable)
    const books = await loadModel('assets/models/books.glb');
    if (books) {
        books.position.set(-4, 1, -halfDepth + 0.5);
        books.name = "books";
        engine.interactables.push(books);
        scene.add(books);
    }

    // Globe (interactable)
    const globeGroup = new THREE.Group();
    globeGroup.position.set(3, 0, halfDepth - 1.5);

    const globeBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    globeBase.position.y = 0.75;
    globeGroup.add(globeBase);

    const globe = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0x4682B4, roughness: 0.6 })
    );
    globe.position.y = 1.05;
    globe.name = "globe";
    engine.interactables.push(globe);
    globeGroup.add(globe);
    scene.add(globeGroup);

    // Clock on back wall
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0, 2.2, -halfDepth + 0.1);

    const clockFrame = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
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

    // Trash can (interactable)
    const trash = await loadModel('assets/models/trashcan.glb');
    if (trash) {
        trash.position.set(4, 0, -halfDepth + 0.5);
        trash.name = "trash";
        engine.interactables.push(trash);
        scene.add(trash);
    }

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

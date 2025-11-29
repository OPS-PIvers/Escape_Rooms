// Office Escape Room - Rebuilt from template with RoomEngine
console.log("office.js loaded");

import * as THREE from 'three';
import { RoomEngine } from './roomEngine.js';
import { showModal } from './ui.js?v=0fc212f';
import { initGame } from './gameLogic.js';
import { WALL_HEIGHT, DESK_SURFACE_Y } from './constants.js';
import * as Prefabs from './prefabs.js?v=1b03dd5&t=1764425183';

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

    // Executive Desk Area (back left corner)
    const desk = Prefabs.createDesk(1.5, 0.75, 0.8);
    desk.position.set(-halfWidth + 1.5, 0, -halfDepth + 1.5);
    desk.rotation.y = Math.PI / 4; // Angled toward room
    desk.name = "desk";
    engine.interactables.push(desk);

    // Register ALL drawers as interactable (any drawer opens the top one)
    if (desk.userData.drawers && desk.userData.drawers.length > 0) {
        desk.userData.drawers.forEach(drawerGroup => {
            drawerGroup.children.forEach(child => {
                if (child.name && child.name.startsWith('drawer_')) {
                    engine.interactables.push(child);
                }
            });
        });

        const topDrawer = desk.userData.drawers[2]; // Top drawer is index 2

        // Add notepad with handwritten note to drawer 2
        try {
            // Make notepad much bigger and thicker
            const notepad = Prefabs.createNotepad(0.15, 0.03, 0.2);
            // Raise it up higher so it's above the drawer parts and easier to click
            notepad.position.set(0.05, 0.02, 0.05);
            notepad.rotation.y = Math.PI / 6; // Slight angle
            console.log('Created notepad:', notepad);
            // Make notepad interactable
            notepad.children.forEach(child => {
                if (child.name === 'notepad') {
                    engine.interactables.push(child);
                    console.log('Added notepad to interactables');
                }
            });
            topDrawer.add(notepad);
            console.log('Added notepad to drawer 2');

            // Add pens to drawer 2 (make them much bigger)
            const penColors = [0x0000ff, 0xff0000, 0x000000];
            for (let i = 0; i < 3; i++) {
                const pen = Prefabs.createPen(0.12, 0.008);  // Increased radius from 0.003 to 0.008
                // Change pen color
                pen.children[0].material = new THREE.MeshStandardMaterial({
                    color: penColors[i],
                    roughness: 0.4
                });
                // Raise pens to match notepad height
                pen.position.set(-0.15 + (i * 0.04), 0.01, -0.05 + (i * 0.02));
                pen.rotation.y = Math.random() * Math.PI / 4;
                topDrawer.add(pen);
            }
            console.log('Added 3 pens to drawer 2');
        } catch (error) {
            console.error('Error adding notepad/pens to drawer:', error);
        }
    }

    scene.add(desk);

    // Desk Chair (facing the desk)
    const deskChair = Prefabs.createChair(0.5, 0.9);
    deskChair.position.set(-halfWidth + 2.3, 0, -halfDepth + 2.3);
    deskChair.rotation.y = Math.PI / 4 + Math.PI; // Facing desk
    scene.add(deskChair);

    // Computer on desk (scaled bigger and moved forward toward chair)
    const computer = Prefabs.createComputer(0.5, 0.4);
    computer.position.set(-halfWidth + 1.5, DESK_SURFACE_Y, -halfDepth + 1.3);
    computer.rotation.y = Math.PI / 4; // Screen faces chair
    computer.children[0].name = "computer"; // Make screen interactable
    engine.interactables.push(computer.children[0]);
    scene.add(computer);

    // Keyboard on desk (in front of monitor)
    const keyboard = Prefabs.createKeyboard(0.4, 0.15);
    keyboard.position.set(-halfWidth + 1.7, DESK_SURFACE_Y, -halfDepth + 1.5);
    keyboard.rotation.y = Math.PI / 4; // Aligned with monitor
    scene.add(keyboard);

    // Mouse on desk (to the right of keyboard)
    const mouse = Prefabs.createMouse();
    mouse.position.set(-halfWidth + 1.9, DESK_SURFACE_Y, -halfDepth + 1.3);
    mouse.rotation.y = Math.PI / 4; // Aligned with setup
    scene.add(mouse);

    console.log(`Office loaded: ${engine.interactables.length} interactable objects`);

    // Return engine and desk for drawer animation
    return { engine, desk };
}

// Drawer interaction handler (any drawer opens the top one)
function handleDrawerInteraction(clickedMesh) {
    // Get the drawer group from the clicked mesh
    const clickedDrawerGroup = clickedMesh.userData.drawerGroup;
    if (!clickedDrawerGroup) return;

    // Find the desk (parent of the drawer group)
    const desk = clickedDrawerGroup.parent;
    if (!desk || !desk.userData.drawers) return;

    // Always target the top drawer (index 2)
    const topDrawer = desk.userData.drawers[2];
    if (!topDrawer) return;

    // Toggle top drawer open/closed
    topDrawer.userData.isOpen = !topDrawer.userData.isOpen;
    topDrawer.userData.targetZ = topDrawer.userData.isOpen ? topDrawer.userData.openDistance : 0;
}

function animateDrawers(desk, deltaTime) {
    if (!desk.userData.drawers) return;

    desk.userData.drawers.forEach(drawer => {
        // Smooth animation toward target position
        const speed = 2.0; // Animation speed
        const diff = drawer.userData.targetZ - drawer.position.z;

        if (Math.abs(diff) > 0.001) {
            drawer.position.z += diff * speed * deltaTime;
        } else {
            drawer.position.z = drawer.userData.targetZ;
        }
    });
}

// Show notepad modal with handwritten note
function showNotepadModal() {
    // Use showModal from ui.js but customize the content
    showModal('notepad_custom', {});

    // Override the modal content with our custom notepad display
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    modalTitle.textContent = "NOTEPAD";
    modalContent.innerHTML = `
        <div style="
            background: #f5f5dc;
            padding: 20px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            color: #1a1a1a;
            line-height: 1.8;
            position: relative;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
        ">
            <div style="
                font-family: 'Brush Script MT', cursive, 'Comic Sans MS', cursive;
                font-size: 18px;
                color: #1a3a5a;
                transform: rotate(-1deg);
            ">
                <p style="margin: 5px 0;">Remember:</p>
                <p style="margin: 5px 0; margin-left: 15px;">- Check filing cabinet</p>
                <p style="margin: 5px 0; margin-left: 15px;">- Call Sarah about project</p>
                <p style="margin: 5px 0; margin-left: 15px;">- Safe combo: year MN became state</p>
                <p style="margin: 15px 0 5px 0; font-style: italic; font-size: 16px;">
                    "The past holds the key..."
                </p>
            </div>
        </div>
    `;
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
            // Handle notepad interaction (check BEFORE drawer)
            if (name === 'notepad') {
                // Check if the drawer containing the notepad is open
                // Notepad is a child of the drawer group (drawer 2)
                const parentDrawer = obj.parent;
                if (parentDrawer && parentDrawer.userData.isOpen) {
                    showNotepadModal();
                }
                return;
            }
            // Handle drawer interactions
            if (name && name.startsWith('drawer_')) {
                handleDrawerInteraction(obj);
                return; // Don't show modal for drawers
            }
            // Handle other interactions via game logic
            showModal(name, {});
        }
    });

    // Build the office scene
    const { desk } = await buildOfficeScene(engine);

    // Create door and timer (since we're not using procedural room)
    engine.createDoor();
    engine.createTimer();

    // Initialize game logic (puzzles, clues, etc.)
    initGame();

    // Add drawer animation to the render loop
    const originalAnimate = engine.animate.bind(engine);
    engine.animate = function(time) {
        originalAnimate(time);
        // Animate drawers (deltaTime is approximately 1/60 for 60fps)
        animateDrawers(desk, 1/60);
    };

    // Start the engine
    engine.start();

    // Expose for debugging
    window.engine = engine;
    window.desk = desk;
}

// Start
initOffice();

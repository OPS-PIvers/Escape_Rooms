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

    // Create invisible interaction meshes for drawers (any drawer opens the top one)
    if (desk.userData.drawers && desk.userData.drawers.length > 0) {
        // For each drawer, add an invisible clickable mesh on the exterior
        desk.userData.drawers.forEach((drawerGroup, index) => {
            // Get drawer dimensions (assuming standard desk drawer from prefabs)
            const drawerWidth = 1.5 * 0.4; // width * 0.4 from prefabs
            const drawerHeight = 0.75 * 0.25; // height * 0.25 from prefabs

            // Create invisible mesh covering the front face of the drawer
            const clickMesh = new THREE.Mesh(
                new THREE.BoxGeometry(drawerWidth, drawerHeight, 0.01),
                new THREE.MeshBasicMaterial({
                    transparent: true,
                    opacity: 0,
                    side: THREE.DoubleSide
                })
            );
            // Position it at the front of the drawer (where the visible front is)
            const drawerDepth = 0.8 - 0.1; // desk depth - 0.1 from prefabs
            clickMesh.position.z = drawerDepth/2;
            clickMesh.name = `drawer_${index}_click`;
            clickMesh.userData.drawerGroup = drawerGroup;

            // Add to drawer group and make interactable
            drawerGroup.add(clickMesh);
            engine.interactables.push(clickMesh);
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

    // ===== LIBRARY ON EAST WALL =====
    // Create multiple bookshelves spanning the entire east wall
    const shelfDepth = 0.4;
    const shelfHeight = 2.0;
    const numShelves = 4; // Number of shelves per bookshelf unit
    const shelfPositions = [
        { z: -4.5, width: 2.5 },
        { z: -1.5, width: 2.5 },
        { z: 1.5, width: 2.5 },
        { z: 4.5, width: 2.5 }
    ];

    // Secret bookshelf door variables
    let secretBookshelfPivot = null;
    let secretBookshelfOpen = false;

    shelfPositions.forEach((config, idx) => {
        // Bookshelf 2 (idx === 1) is the SECRET DOOR
        if (idx === 1) {
            // Create pivot point for swinging bookshelf
            secretBookshelfPivot = new THREE.Group();
            // Position pivot at the LEFT edge of the bookshelf (where hinge would be)
            secretBookshelfPivot.position.set(halfWidth - shelfDepth/2 - 0.3 - config.width/2, 0, config.z);
            scene.add(secretBookshelfPivot);

            // Create bookshelf and add to pivot
            const bookshelf = Prefabs.createBookshelf(config.width, shelfHeight, shelfDepth, numShelves);
            bookshelf.position.set(config.width/2, 0, 0); // Offset from pivot point
            secretBookshelfPivot.add(bookshelf);
        } else {
            // Normal static bookshelf
            const bookshelf = Prefabs.createBookshelf(config.width, shelfHeight, shelfDepth, numShelves);
            bookshelf.position.set(halfWidth - shelfDepth/2 - 0.3, 0, config.z);
            scene.add(bookshelf);
        }

        // Populate shelves with interactive items
        const shelfSpacing = shelfHeight / numShelves;

        // Bottom shelf (shelf 0) - Books and decorations
        if (idx === 0) {
            const books1 = Prefabs.createBooks(7, 0.15);
            books1.position.set(halfWidth - shelfDepth/2 - 0.3 - 0.8, shelfSpacing * 0 + 0.1, config.z - 0.3);
            books1.name = "library_books_1";
            engine.interactables.push(books1);
            scene.add(books1);

            const plant1 = Prefabs.createPlant(0.08, 0.3);
            plant1.position.set(halfWidth - shelfDepth/2 - 0.3 + 0.6, shelfSpacing * 0 + 0.05, config.z + 0.4);
            plant1.children.forEach(child => {
                if (child.name === 'globe') child.name = 'library_plant_1';
            });
            plant1.name = "library_plant_1";
            engine.interactables.push(plant1);
            scene.add(plant1);
        }

        // Shelf 1 - SECRET BOOKSHELF with trigger book
        if (idx === 1) {
            // Create special RED trigger book
            const triggerBook = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.25, 0.03),
                new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.8 })
            );
            // Position it on shelf 2 (middle shelf) sticking out slightly
            const bookX = config.width/2 - 0.8;
            const bookY = shelfSpacing * 2 + 0.15;
            const bookZ = shelfDepth/2 + 0.02; // Stick out from shelf front
            triggerBook.position.set(bookX, bookY, bookZ);
            triggerBook.castShadow = true;
            triggerBook.name = "secret_book";
            triggerBook.userData.isSecretTrigger = true;
            secretBookshelfPivot.add(triggerBook);
            engine.interactables.push(triggerBook);

            // Add regular books to the secret bookshelf
            const books2 = Prefabs.createBooks(6, 0.15);
            books2.position.set(config.width/2 - 0.5, shelfSpacing * 1 + 0.05, 0);
            books2.name = "library_books_2";
            engine.interactables.push(books2);
            secretBookshelfPivot.add(books2);

            const globe = Prefabs.createGlobe(0.15);
            globe.position.set(config.width/2 + 0.4, shelfSpacing * 1 + 0.05, 0);
            globe.children.forEach(child => {
                if (child.name === 'globe') {
                    engine.interactables.push(child);
                }
            });
            secretBookshelfPivot.add(globe);
        }

        // Shelf 2 - Books and small lamp
        if (idx === 2) {
            const books3 = Prefabs.createBooks(8, 0.15);
            books3.position.set(halfWidth - shelfDepth/2 - 0.3 - 0.7, shelfSpacing * 2 + 0.05, config.z - 0.2);
            books3.name = "library_books_3";
            engine.interactables.push(books3);
            scene.add(books3);

            const lamp = Prefabs.createLamp('desk');
            lamp.position.set(halfWidth - shelfDepth/2 - 0.3 + 0.7, shelfSpacing * 2 + 0.05, config.z + 0.5);
            lamp.name = "library_lamp";
            engine.interactables.push(lamp);
            scene.add(lamp);
        }

        // Shelf 3 - Books and decorative items
        if (idx === 3) {
            const books4 = Prefabs.createBooks(5, 0.15);
            books4.position.set(halfWidth - shelfDepth/2 - 0.3 - 0.4, shelfSpacing * 3 + 0.05, config.z - 0.6);
            books4.name = "library_books_4";
            engine.interactables.push(books4);
            scene.add(books4);

            const plant2 = Prefabs.createPlant(0.07, 0.25);
            plant2.position.set(halfWidth - shelfDepth/2 - 0.3 + 0.5, shelfSpacing * 3 + 0.05, config.z + 0.2);
            plant2.name = "library_plant_2";
            engine.interactables.push(plant2);
            scene.add(plant2);
        }

        // Add varied items to other shelves
        if (idx === 0) {
            // Additional books on shelf 2
            const books5 = Prefabs.createBooks(6, 0.15);
            books5.position.set(halfWidth - shelfDepth/2 - 0.3 + 0.2, shelfSpacing * 2 + 0.05, config.z + 0.1);
            books5.name = "library_books_5";
            engine.interactables.push(books5);
            scene.add(books5);

            // Briefcase on shelf 1
            const briefcase = Prefabs.createBriefcase(0.4, 0.12, 0.3);
            briefcase.position.set(halfWidth - shelfDepth/2 - 0.3 + 0.6, shelfSpacing * 1 + 0.08, config.z - 0.3);
            briefcase.name = "library_briefcase";
            engine.interactables.push(briefcase);
            scene.add(briefcase);
        }

        if (idx === 1) {
            // Books on shelf 3
            const books6 = Prefabs.createBooks(7, 0.15);
            books6.position.set(halfWidth - shelfDepth/2 - 0.3 - 0.6, shelfSpacing * 3 + 0.05, config.z - 0.4);
            books6.name = "library_books_6";
            engine.interactables.push(books6);
            scene.add(books6);

            // Small plant on shelf 2
            const plant3 = Prefabs.createPlant(0.06, 0.2);
            plant3.position.set(halfWidth - shelfDepth/2 - 0.3 + 0.8, shelfSpacing * 2 + 0.05, config.z + 0.3);
            plant3.name = "library_plant_3";
            engine.interactables.push(plant3);
            scene.add(plant3);
        }

        if (idx === 2) {
            // Books on bottom shelf
            const books7 = Prefabs.createBooks(9, 0.15);
            books7.position.set(halfWidth - shelfDepth/2 - 0.3 - 0.3, shelfSpacing * 0 + 0.1, config.z - 0.5);
            books7.name = "library_books_7";
            engine.interactables.push(books7);
            scene.add(books7);

            // Another globe on shelf 3
            const globe2 = Prefabs.createGlobe(0.12);
            globe2.position.set(halfWidth - shelfDepth/2 - 0.3 + 0.6, shelfSpacing * 3 + 0.05, config.z + 0.4);
            globe2.children.forEach(child => {
                if (child.name === 'globe') {
                    child.name = 'library_globe_2';
                    engine.interactables.push(child);
                }
            });
            scene.add(globe2);
        }

        if (idx === 3) {
            // Books on shelf 1
            const books8 = Prefabs.createBooks(8, 0.15);
            books8.position.set(halfWidth - shelfDepth/2 - 0.3 - 0.7, shelfSpacing * 1 + 0.05, config.z - 0.2);
            books8.name = "library_books_8";
            engine.interactables.push(books8);
            scene.add(books8);

            // Books on shelf 2
            const books9 = Prefabs.createBooks(6, 0.15);
            books9.position.set(halfWidth - shelfDepth/2 - 0.3 + 0.3, shelfSpacing * 2 + 0.05, config.z + 0.4);
            books9.name = "library_books_9";
            engine.interactables.push(books9);
            scene.add(books9);

            // Decorative item on bottom shelf
            const plant4 = Prefabs.createPlant(0.08, 0.25);
            plant4.position.set(halfWidth - shelfDepth/2 - 0.3 + 0.7, shelfSpacing * 0 + 0.05, config.z + 0.5);
            plant4.name = "library_plant_4";
            engine.interactables.push(plant4);
            scene.add(plant4);
        }
    });

    // ===== HIDDEN ROOM BEHIND SECRET BOOKSHELF =====
    // Create a small secret room behind the bookshelf (idx === 1, z = -1.5)
    const hiddenRoomWidth = 3.0;
    const hiddenRoomDepth = 2.5;
    const hiddenRoomX = halfWidth + hiddenRoomWidth/2 + 0.2; // Beyond the east wall
    const hiddenRoomZ = -1.5; // Same Z as secret bookshelf

    const hiddenRoomMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        roughness: 0.9,
        side: THREE.BackSide // Interior walls
    });

    // Hidden room floor
    const hiddenFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(hiddenRoomWidth, hiddenRoomDepth),
        materials.floor
    );
    hiddenFloor.rotation.x = -Math.PI / 2;
    hiddenFloor.position.set(hiddenRoomX, 0, hiddenRoomZ);
    hiddenFloor.receiveShadow = true;
    scene.add(hiddenFloor);

    // Hidden room back wall (east side)
    const hiddenBackWall = new THREE.Mesh(
        new THREE.BoxGeometry(hiddenRoomWidth, WALL_HEIGHT, WALL_THICKNESS),
        hiddenRoomMaterial
    );
    hiddenBackWall.position.set(hiddenRoomX, WALL_HEIGHT/2, hiddenRoomZ);
    hiddenBackWall.rotation.y = Math.PI / 2;
    hiddenBackWall.castShadow = true;
    hiddenBackWall.receiveShadow = true;
    scene.add(hiddenBackWall);

    // Hidden room side walls (north and south)
    const hiddenSideWall1 = new THREE.Mesh(
        new THREE.BoxGeometry(hiddenRoomDepth, WALL_HEIGHT, WALL_THICKNESS),
        hiddenRoomMaterial
    );
    hiddenSideWall1.position.set(hiddenRoomX, WALL_HEIGHT/2, hiddenRoomZ + hiddenRoomDepth/2);
    hiddenSideWall1.castShadow = true;
    hiddenSideWall1.receiveShadow = true;
    scene.add(hiddenSideWall1);

    const hiddenSideWall2 = new THREE.Mesh(
        new THREE.BoxGeometry(hiddenRoomDepth, WALL_HEIGHT, WALL_THICKNESS),
        hiddenRoomMaterial
    );
    hiddenSideWall2.position.set(hiddenRoomX, WALL_HEIGHT/2, hiddenRoomZ - hiddenRoomDepth/2);
    hiddenSideWall2.castShadow = true;
    hiddenSideWall2.receiveShadow = true;
    scene.add(hiddenSideWall2);

    // Hidden room ceiling
    const hiddenCeiling = new THREE.Mesh(
        new THREE.PlaneGeometry(hiddenRoomWidth, hiddenRoomDepth),
        materials.ceiling
    );
    hiddenCeiling.rotation.x = Math.PI / 2;
    hiddenCeiling.position.set(hiddenRoomX, WALL_HEIGHT, hiddenRoomZ);
    scene.add(hiddenCeiling);

    // Add the SAFE to the hidden room
    const safe = Prefabs.createSafe(0.8, 1.0, 0.8);
    safe.position.set(hiddenRoomX + 0.8, 0, hiddenRoomZ); // Against back wall
    safe.children[0].name = "safe";
    engine.interactables.push(safe.children[0]);
    scene.add(safe);

    // Add a light in the hidden room
    const hiddenRoomLight = new THREE.PointLight(0xffaa66, 0.8, 6);
    hiddenRoomLight.position.set(hiddenRoomX, WALL_HEIGHT - 0.5, hiddenRoomZ);
    hiddenRoomLight.castShadow = true;
    scene.add(hiddenRoomLight);

    console.log(`Office loaded: ${engine.interactables.length} interactable objects`);

    // Return engine, desk, and secret bookshelf for animation
    return {
        engine,
        desk,
        secretBookshelfPivot,
        getSecretBookshelfState: () => secretBookshelfOpen,
        toggleSecretBookshelf: () => {
            secretBookshelfOpen = !secretBookshelfOpen;
            return secretBookshelfOpen;
        }
    };
}

// Drawer interaction handler (any drawer opens the top one)
function handleDrawerInteraction(clickedMesh, engine) {
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
    const wasOpen = topDrawer.userData.isOpen;
    topDrawer.userData.isOpen = !wasOpen;
    topDrawer.userData.targetZ = topDrawer.userData.isOpen ? topDrawer.userData.openDistance : 0;

    // Manage click mesh interactability
    // Find the click mesh in the top drawer
    const clickMesh = topDrawer.children.find(child => child.name && child.name.includes('_click'));
    if (clickMesh && engine) {
        if (topDrawer.userData.isOpen) {
            // Drawer opening - remove click mesh from interactables so notepad can be clicked
            const index = engine.interactables.indexOf(clickMesh);
            if (index > -1) {
                engine.interactables.splice(index, 1);
            }
        } else {
            // Drawer closing - add click mesh back to interactables
            if (!engine.interactables.includes(clickMesh)) {
                engine.interactables.push(clickMesh);
            }
        }
    }
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

// Animate secret bookshelf door
function animateSecretBookshelf(pivot, isOpen, deltaTime) {
    if (!pivot) return;

    const targetRotation = isOpen ? -Math.PI / 2 : 0; // 90 degrees when open
    const speed = 2.0; // Animation speed
    const diff = targetRotation - pivot.rotation.y;

    if (Math.abs(diff) > 0.001) {
        pivot.rotation.y += diff * speed * deltaTime;
    } else {
        pivot.rotation.y = targetRotation;
    }
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
    // Office scene data (will be set after building scene)
    let officeData = null;

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
            // Handle secret book trigger
            if (name === 'secret_book' && officeData) {
                const isOpen = officeData.toggleSecretBookshelf();
                console.log(`Secret bookshelf ${isOpen ? 'opening' : 'closing'}...`);
                showModal(name, {});
                return;
            }
            // Handle notepad interaction (check BEFORE drawer)
            if (name === 'notepad') {
                // Check if the drawer containing the notepad is open
                // Notepad paper (obj) -> Notepad Group -> Drawer Group
                const notepadGroup = obj.parent;
                const drawerGroup = notepadGroup ? notepadGroup.parent : null;

                if (drawerGroup && drawerGroup.userData.isOpen) {
                    showNotepadModal();
                }
                return;
            }
            // Handle drawer click mesh interactions
            if (name && name.includes('_click')) {
                handleDrawerInteraction(obj, engine);
                return;
            }
            // Handle other interactions via game logic
            showModal(name, {});
        }
    });

    // Build the office scene
    officeData = await buildOfficeScene(engine);
    const { desk, secretBookshelfPivot, getSecretBookshelfState } = officeData;

    // Create door and timer (since we're not using procedural room)
    engine.createDoor();
    engine.createTimer();

    // Initialize game logic (puzzles, clues, etc.)
    initGame();

    // Add drawer and secret bookshelf animation to the render loop
    const originalAnimate = engine.animate.bind(engine);
    engine.animate = function(time) {
        originalAnimate(time);
        // Animate drawers (deltaTime is approximately 1/60 for 60fps)
        animateDrawers(desk, 1/60);
        // Animate secret bookshelf
        animateSecretBookshelf(secretBookshelfPivot, getSecretBookshelfState(), 1/60);
    };

    // Start the engine
    engine.start();

    // Expose for debugging
    window.engine = engine;
    window.desk = desk;
    window.secretBookshelf = secretBookshelfPivot;
}

// Start
initOffice();

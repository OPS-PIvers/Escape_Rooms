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

// Helper function to register bookshelf shelf rows as interactables
function registerBookshelfInteractables(bookshelf, engine, prefix = "bookshelf") {
    if (bookshelf.userData.shelfRows) {
        bookshelf.userData.shelfRows.forEach((shelfRow, idx) => {
            // Find the hitbox in this shelf row and register it
            const hitbox = shelfRow.children.find(child => child.name && child.name.includes('hitbox'));
            if (hitbox) {
                hitbox.name = `${prefix}_shelf_${idx}`;
                engine.interactables.push(hitbox);
            }
        });
    }
}

// Build the office scene
async function buildOfficeScene(engine) {
    const scene = engine.scene;
    const halfWidth = OFFICE_WIDTH / 2;
    const halfDepth = OFFICE_DEPTH / 2;

    // ===== ROOM STRUCTURE (Procedural) =====

    // Define shelf dimensions early for wall construction
    const shelfWidth = 3.0;
    const shelfDepth = 0.4;
    const shelfHeight = 2.0;
    const numShelves = 4; // Number of shelf rows per bookshelf unit

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
        // Right wall (East) - Will be split to create opening for secret door (handled below)
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

    // East wall (Right) - Solid wall with opening for secret bookshelf door
    // Secret bookshelf is at z = -1.5, width 3.0, so opening spans z = -3.0 to z = 0.0
    const eastOpeningZ = -1.5;
    const eastOpeningWidth = shelfWidth; // 3.0
    const eastOpeningZMin = eastOpeningZ - eastOpeningWidth / 2; // -3.0
    const eastOpeningZMax = eastOpeningZ + eastOpeningWidth / 2; // 0.0

    // North section of east wall (runs from z = -6 to z = -3)
    const eastWallNorth = new THREE.Mesh(
        new THREE.BoxGeometry(eastOpeningZMin - (-halfDepth), WALL_HEIGHT, WALL_THICKNESS),
        materials.wall
    );
    eastWallNorth.position.set(
        halfWidth,
        WALL_HEIGHT / 2,
        (eastOpeningZMin + (-halfDepth)) / 2 // Center between -6 and -3
    );
    eastWallNorth.rotation.y = -Math.PI / 2; // Face inward (North-South alignment)
    eastWallNorth.castShadow = true;
    eastWallNorth.receiveShadow = true;
    scene.add(eastWallNorth);

    // South section of east wall (runs from z = 0 to z = 6)
    const eastWallSouth = new THREE.Mesh(
        new THREE.BoxGeometry(halfDepth - eastOpeningZMax, WALL_HEIGHT, WALL_THICKNESS),
        materials.wall
    );
    eastWallSouth.position.set(
        halfWidth,
        WALL_HEIGHT / 2,
        (eastOpeningZMax + halfDepth) / 2 // Center between 0 and 6
    );
    eastWallSouth.rotation.y = -Math.PI / 2; // Face inward (North-South alignment)
    eastWallSouth.castShadow = true;
    eastWallSouth.receiveShadow = true;
    scene.add(eastWallSouth);

    // Lintel above secret bookshelf (to form doorway)
    const eastWallLintel = new THREE.Mesh(
        new THREE.BoxGeometry(eastOpeningWidth, WALL_HEIGHT - shelfHeight, WALL_THICKNESS),
        materials.wall
    );
    eastWallLintel.position.set(
        halfWidth,
        shelfHeight + (WALL_HEIGHT - shelfHeight) / 2,
        eastOpeningZ
    );
    eastWallLintel.rotation.y = -Math.PI / 2;
    eastWallLintel.castShadow = true;
    eastWallLintel.receiveShadow = true;
    scene.add(eastWallLintel);

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
                pen.name = `pen_${i}`;
                engine.interactables.push(pen);
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
    deskChair.name = "chair";
    engine.interactables.push(deskChair);
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
    keyboard.name = "keyboard";
    engine.interactables.push(keyboard);
    scene.add(keyboard);

    // Mouse on desk (to the right of keyboard)
    const mouse = Prefabs.createMouse();
    mouse.position.set(-halfWidth + 1.9, DESK_SURFACE_Y, -halfDepth + 1.3);
    mouse.rotation.y = Math.PI / 4; // Aligned with setup
    mouse.name = "mouse";
    engine.interactables.push(mouse);
    scene.add(mouse);

    // Globe on desk (SECRET DOOR TRIGGER)
    const globe = Prefabs.createGlobe(0.15);
    globe.position.set(-halfWidth + 0.9, DESK_SURFACE_Y, -halfDepth + 1.0);
    globe.rotation.y = Math.PI / 6;
    // Find the globe sphere and make it the trigger
    const globeSphere = globe.children.find(child => child.name === "globe");
    if (globeSphere) {
        globeSphere.name = "secret_globe";
        globeSphere.userData.isSecretTrigger = true;
        engine.interactables.push(globeSphere);
    }
    scene.add(globe);

    // ===== SITTING AREA (Southwest Corner) =====
    const sittingAreaX = -halfWidth + 2.5;
    const sittingAreaZ = halfDepth - 2.5;

    // Rug (foundation of the sitting area)
    const rug = Prefabs.createRug(3.0, 2.5);
    rug.position.set(sittingAreaX, 0, sittingAreaZ);
    scene.add(rug);

    // Sofa (against south wall, facing north)
    const sofa = Prefabs.createSofa(2.0, 0.9, 0.45);
    sofa.position.set(sittingAreaX, 0, halfDepth - 1.2);
    sofa.rotation.y = Math.PI; // Face north into room
    sofa.name = "sofa";
    engine.interactables.push(sofa);
    scene.add(sofa);

    // Armchair (east side of coffee table, angled toward sofa and TV)
    const armchair = Prefabs.createArmchair(0.9, 0.9, 0.45);
    armchair.position.set(sittingAreaX + 1.2, 0, sittingAreaZ - 0.5);
    armchair.rotation.y = -Math.PI / 2; // Rotated 135° clockwise from original
    armchair.name = "armchair";
    engine.interactables.push(armchair);
    scene.add(armchair);

    // Coffee Table (in front of sofa)
    const coffeeTableHeight = 0.35;
    const coffeeTable = Prefabs.createCoffeeTable(1.0, coffeeTableHeight, 0.6);
    coffeeTable.position.set(sittingAreaX, 0, sittingAreaZ);
    coffeeTable.name = "coffee_table";
    engine.interactables.push(coffeeTable);
    scene.add(coffeeTable);

    // TV Stand with TV (against west wall, facing east)
    const tvStand = Prefabs.createTVStand(1.2, 0.7, 1.5);
    tvStand.position.set(-halfWidth + 0.5, 0, sittingAreaZ);
    tvStand.rotation.y = Math.PI / 2; // Face east into room
    // Find and register TV screen as interactable
    const tvScreen = tvStand.children.find(child => child.name === "tv_screen");
    if (tvScreen) {
        tvScreen.name = "tv";
        engine.interactables.push(tvScreen);
    }
    scene.add(tvStand);

    // Floor Lamp (beside armchair on east side)
    const floorLamp = Prefabs.createLamp('floor');
    floorLamp.position.set(sittingAreaX + 1.8, 0, sittingAreaZ - 1.0);
    floorLamp.name = "floor_lamp";
    engine.interactables.push(floorLamp);
    scene.add(floorLamp);

    // Coffee Cup on table
    const coffeeCup = Prefabs.createCoffeeCup(0.04, 0.1);
    coffeeCup.position.set(sittingAreaX - 0.2, coffeeTableHeight, sittingAreaZ + 0.1);
    coffeeCup.name = "coffee_cup";
    engine.interactables.push(coffeeCup);
    scene.add(coffeeCup);

    // Newspaper on table
    const newspaper = Prefabs.createNewspaper(0.3, 0.4);
    newspaper.position.set(sittingAreaX + 0.2, coffeeTableHeight, sittingAreaZ - 0.1);
    newspaper.rotation.y = Math.PI / 8; // Slight angle
    newspaper.name = "newspaper";
    engine.interactables.push(newspaper);
    scene.add(newspaper);

    // Remote Control on table
    const remote = Prefabs.createRemote(0.15, 0.05);
    remote.position.set(sittingAreaX - 0.3, coffeeTableHeight, sittingAreaZ - 0.2);
    remote.rotation.y = -Math.PI / 6; // Angled
    remote.name = "remote";
    engine.interactables.push(remote);
    scene.add(remote);

    // ===== LIBRARY ON EAST WALL =====
    // Create multiple bookshelves spanning the entire east wall
    // Each bookshelf is 3 units wide, 4 bookshelves fit perfectly in 12-unit room
    // (Shelf dimensions defined at start of function)
    const shelfPositions = [
        { z: -4.5 },
        { z: -1.5 },
        { z: 1.5 },
        { z: 4.5 }
    ];

    // Secret bookshelf door variables
    let secretBookshelfPivot = null;
    let secretBookshelfOpen = false;

    shelfPositions.forEach((config, idx) => {
        let bookshelf;

        // Bookshelf 2 (idx === 1) is the SECRET DOOR
        if (idx === 1) {
            // Create pivot point for swinging bookshelf
            secretBookshelfPivot = new THREE.Group();
            // Position pivot at the back edge of the bookshelf (where hinge would be, against the wall)
            secretBookshelfPivot.position.set(halfWidth - shelfDepth/2 - 0.3, 0, config.z - shelfWidth/2);
            scene.add(secretBookshelfPivot);

            // Create bookshelf with pre-populated books and add to pivot
            bookshelf = Prefabs.createBookshelf(shelfWidth, shelfHeight, shelfDepth, numShelves);
            bookshelf.position.set(0, 0, shelfWidth/2); // Offset from pivot point
            bookshelf.rotation.y = -Math.PI / 2; // Rotate to face west (into room)
            secretBookshelfPivot.add(bookshelf);

            // Register shelf rows as interactables
            registerBookshelfInteractables(bookshelf, engine, "secret_bookshelf");
        } else {
            // Normal static bookshelf with pre-populated books
            bookshelf = Prefabs.createBookshelf(shelfWidth, shelfHeight, shelfDepth, numShelves);
            bookshelf.position.set(halfWidth - shelfDepth/2 - 0.3, 0, config.z);
            bookshelf.rotation.y = -Math.PI / 2; // Rotate to face west (into room)
            scene.add(bookshelf);

            // Register shelf rows as interactables
            registerBookshelfInteractables(bookshelf, engine, `bookshelf_${idx}`);
        }
    });

    // ===== HIDDEN ROOM BEHIND SECRET BOOKSHELF =====
    // Create a small secret room behind the bookshelf (idx === 1, z = -1.5)
    const hiddenRoomWidth = 3.0;
    const hiddenRoomDepth = 2.5;
    const hiddenRoomX = halfWidth + hiddenRoomWidth/2 + 0.2; // Beyond the east wall
    const hiddenRoomZ = -1.5; // Same Z as secret bookshelf
    const hiddenRoomHeight = shelfHeight; // Match bookshelf height

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
        new THREE.BoxGeometry(hiddenRoomWidth, hiddenRoomHeight, WALL_THICKNESS),
        hiddenRoomMaterial
    );
    hiddenBackWall.position.set(hiddenRoomX, hiddenRoomHeight/2, hiddenRoomZ);
    hiddenBackWall.rotation.y = Math.PI / 2;
    hiddenBackWall.castShadow = true;
    hiddenBackWall.receiveShadow = true;
    scene.add(hiddenBackWall);

    // Hidden room side walls (north and south)
    const hiddenSideWall1 = new THREE.Mesh(
        new THREE.BoxGeometry(hiddenRoomDepth, hiddenRoomHeight, WALL_THICKNESS),
        hiddenRoomMaterial
    );
    hiddenSideWall1.position.set(hiddenRoomX, hiddenRoomHeight/2, hiddenRoomZ + hiddenRoomDepth/2);
    hiddenSideWall1.castShadow = true;
    hiddenSideWall1.receiveShadow = true;
    scene.add(hiddenSideWall1);

    const hiddenSideWall2 = new THREE.Mesh(
        new THREE.BoxGeometry(hiddenRoomDepth, hiddenRoomHeight, WALL_THICKNESS),
        hiddenRoomMaterial
    );
    hiddenSideWall2.position.set(hiddenRoomX, hiddenRoomHeight/2, hiddenRoomZ - hiddenRoomDepth/2);
    hiddenSideWall2.castShadow = true;
    hiddenSideWall2.receiveShadow = true;
    scene.add(hiddenSideWall2);

    // Hidden room ceiling
    const hiddenCeiling = new THREE.Mesh(
        new THREE.PlaneGeometry(hiddenRoomWidth, hiddenRoomDepth),
        materials.ceiling
    );
    hiddenCeiling.rotation.x = Math.PI / 2;
    hiddenCeiling.position.set(hiddenRoomX, hiddenRoomHeight, hiddenRoomZ);
    scene.add(hiddenCeiling);

    // Add the SAFE to the hidden room (inside, against the back wall)
    const safe = Prefabs.createSafe(0.8, 1.0, 0.8);
    safe.position.set(hiddenRoomX - 0.8, 0, hiddenRoomZ); // Inside room, against back wall (the bookshelf)
    safe.rotation.y = -Math.PI / 2; // Face west (into the room)
    safe.children[0].name = "safe";
    engine.interactables.push(safe.children[0]);
    scene.add(safe);

    // Add a light in the hidden room
    const hiddenRoomLight = new THREE.PointLight(0xffaa66, 0.8, 6);
    hiddenRoomLight.position.set(hiddenRoomX, hiddenRoomHeight - 0.5, hiddenRoomZ);
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
            // Handle secret globe trigger (opens secret bookshelf door)
            if (name === 'secret_globe' && officeData) {
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
            // Handle pen interactions (only when drawer is open)
            if (name && name.startsWith('pen_')) {
                // Pen -> Drawer Group
                const drawerGroup = obj.parent;
                if (drawerGroup && drawerGroup.userData.isOpen) {
                    showModal(name, {});
                }
                return;
            }
            // Handle all other interactions via game logic
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

    // Store original room bounds
    const originalBounds = { ...engine.roomBounds };

    // Add drawer and secret bookshelf animation to the render loop
    const originalAnimate = engine.animate.bind(engine);
    engine.animate = function(time) {
        originalAnimate(time);
        // Animate drawers (deltaTime is approximately 1/60 for 60fps)
        animateDrawers(desk, 1/60);
        // Animate secret bookshelf
        animateSecretBookshelf(secretBookshelfPivot, getSecretBookshelfState(), 1/60);

        // Dynamically adjust room bounds when secret bookshelf is open
        // This allows the player to access the hidden room beyond the east wall
        if (getSecretBookshelfState()) {
            // Expand east boundary to allow access to hidden room
            engine.roomBounds.maxX = 8.5; // Hidden room extends to ~7.7, add buffer
        } else {
            // Restore original bounds
            engine.roomBounds.maxX = originalBounds.maxX;
        }
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

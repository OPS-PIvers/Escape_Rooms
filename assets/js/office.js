// Office Escape Room - Rebuilt from template with RoomEngine
console.log("office.js loaded");

import * as THREE from 'three';
import { RoomEngine } from './roomEngine.js';
import { showModal } from './ui.js';
import * as gameLogic from './gameLogic.js';
import { WALL_HEIGHT, DESK_SURFACE_Y } from './constants.js';
import * as Prefabs from './prefabs.js';

// Room Configuration
const OFFICE_WIDTH = 10;
const OFFICE_DEPTH = 10;
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
        { width: OFFICE_WIDTH, pos: [0, WALL_HEIGHT / 2, halfDepth] },
        // Left wall (West) - Solid
        { width: OFFICE_DEPTH, pos: [-halfWidth, WALL_HEIGHT / 2, 0], rotY: Math.PI / 2 },
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
        new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, eastOpeningZMin - (-halfDepth)),
        materials.wall
    );
    eastWallNorth.position.set(
        halfWidth,
        WALL_HEIGHT / 2,
        (eastOpeningZMin + (-halfDepth)) / 2 // Center between -6 and -3
    );
    // No rotation needed as geometry is defined along Z-axis
    eastWallNorth.castShadow = true;
    eastWallNorth.receiveShadow = true;
    scene.add(eastWallNorth);

    // South section of east wall (runs from z = 0 to z = 6)
    const eastWallSouth = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, halfDepth - eastOpeningZMax),
        materials.wall
    );
    eastWallSouth.position.set(
        halfWidth,
        WALL_HEIGHT / 2,
        (eastOpeningZMax + halfDepth) / 2 // Center between 0 and 6
    );
    // No rotation needed as geometry is defined along Z-axis
    eastWallSouth.castShadow = true;
    eastWallSouth.receiveShadow = true;
    scene.add(eastWallSouth);

    // Lintel above secret bookshelf (to form doorway)
    const eastWallLintel = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT - shelfHeight, eastOpeningWidth),
        materials.wall
    );
    eastWallLintel.position.set(
        halfWidth,
        shelfHeight + (WALL_HEIGHT - shelfHeight) / 2,
        eastOpeningZ
    );
    // No rotation needed as geometry is defined along Z-axis
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
    wallLeft.position.set(-(doorW / 2 + sideWidth / 2), WALL_HEIGHT / 2, -halfDepth);
    wallLeft.castShadow = true;
    wallLeft.receiveShadow = true;
    scene.add(wallLeft);

    // Right piece of north wall
    const wallRight = new THREE.Mesh(
        new THREE.BoxGeometry(sideWidth, WALL_HEIGHT, WALL_THICKNESS),
        materials.wall
    );
    wallRight.position.set((doorW / 2 + sideWidth / 2), WALL_HEIGHT / 2, -halfDepth);
    wallRight.castShadow = true;
    wallRight.receiveShadow = true;
    scene.add(wallRight);

    // Lintel above door
    const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(doorW, lintelHeight, WALL_THICKNESS),
        materials.wall
    );
    lintel.position.set(0, doorH + lintelHeight / 2, -halfDepth);
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
            clickMesh.position.z = drawerDepth / 2;
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

    // NEW OBJECTS START HERE

    // Trash Can (north side of desk, near the back wall)
    const trashCan = Prefabs.createTrashCan(0.15, 0.4);
    trashCan.position.set(-halfWidth + 1.2, 0, -halfDepth + 0.8);
    trashCan.name = "trash"; // Flavor text key
    engine.interactables.push(trashCan.children[0]);
    scene.add(trashCan);

    // Desk Lamp
    const deskLamp = Prefabs.createLamp('desk');
    deskLamp.position.set(-halfWidth + 1.2, DESK_SURFACE_Y, -halfDepth + 1.0);
    deskLamp.rotation.y = Math.PI / 3;
    deskLamp.name = "lamp"; // Flavor text key
    // Add hitbox or children
    deskLamp.children.forEach(child => {
        if (child.geometry) engine.interactables.push(child);
    });
    scene.add(deskLamp);

    // Filing Cabinet
    const filingCabinet = Prefabs.createFilingCabinet(0.5, 1.0, 0.6);
    filingCabinet.position.set(-halfWidth + 0.5, 0, -halfDepth + 3.0);
    filingCabinet.rotation.y = Math.PI / 2; // Facing into room
    filingCabinet.name = "filing_cabinet";
    // Add interactable parts
    filingCabinet.children.forEach(child => {
        engine.interactables.push(child);
    });
    scene.add(filingCabinet);

    // Paper Shredder (New Puzzle!)
    const shredder = Prefabs.createPaperShredder();
    shredder.position.set(-halfWidth + 1.2, 0, -halfDepth + 2.5); // Near desk/chair
    shredder.rotation.y = Math.PI / 4;
    // Find the head part for interaction
    const shredderHead = shredder.children.find(c => c.name === "shredder");
    const shredderHitbox = shredder.children.find(c => c.name === "shredder_hitbox");
    if (shredderHitbox) {
        engine.interactables.push(shredderHitbox);
    } else if (shredderHead) {
        engine.interactables.push(shredderHead);
    }
    scene.add(shredder);

    // Coat Rack (near entrance - North wall is entrance)
    const coatRack = Prefabs.createCoatRack();
    coatRack.position.set(2, 0, -halfDepth + 0.5); // To the right of the door
    coatRack.name = "coat_rack";
    coatRack.children.forEach(child => {
        if (child.geometry) engine.interactables.push(child);
    });
    scene.add(coatRack);

    // Briefcase
    const briefcase = Prefabs.createBriefcase();
    briefcase.position.set(-halfWidth + 2.5, 0.45, halfDepth - 1.0); // On the sofa
    briefcase.rotation.y = 0.2;
    briefcase.rotation.z = 0.1; // Leaning slightly
    briefcase.name = "briefcase";
    // Find hitbox or just add group children
    briefcase.children.forEach(c => {
        if (c.geometry) engine.interactables.push(c);
    });
    scene.add(briefcase);

    // Wall Clock
    const clock = Prefabs.createClock(0.3);
    clock.position.set(0, 2.5, halfDepth - 0.05); // South wall, high up
    clock.rotation.y = Math.PI; // Face north
    // Find the clock face and make it interactable
    const clockFace = clock.children.find(c => c.name === 'clock');
    if (clockFace) {
        engine.interactables.push(clockFace);
    } else {
        // Fallback to first child or group
        if (clock.children.length > 0) {
            clock.children[0].name = "clock";
            engine.interactables.push(clock.children[0]);
        }
    }
    scene.add(clock);

    // Paintings
    const painting1 = Prefabs.createPainting(1.2, 1.0);
    painting1.position.set(-halfWidth + 0.05, 2.0, 0); // West wall
    painting1.rotation.y = Math.PI / 2;
    painting1.name = "picture";
    engine.interactables.push(painting1);
    scene.add(painting1);

    const painting2 = Prefabs.createPainting(1.0, 0.8);
    painting2.position.set(2, 2.0, halfDepth - 0.05); // South wall
    painting2.rotation.y = Math.PI;
    painting2.name = "picture";
    engine.interactables.push(painting2);
    scene.add(painting2);

    // Plants
    const plant1 = Prefabs.createPlant();
    plant1.position.set(-halfWidth + 0.5, 0, halfDepth - 0.5); // Southwest corner
    plant1.name = "plant";
    engine.interactables.push(plant1);
    scene.add(plant1);

    const plant2 = Prefabs.createPlant();
    plant2.position.set(0, 0, halfDepth - 0.5); // South wall center (Moved from SE corner to avoid bookshelf)
    plant2.name = "plant";
    engine.interactables.push(plant2);
    scene.add(plant2);

    // --- NEW OBJECTS BATCH 2 ---

    // Printer (Near filing cabinet)
    const printer = Prefabs.createPrinter();
    printer.position.set(-halfWidth + 0.5, 1.0, -halfDepth + 3.0); // On top of filing cabinet
    printer.rotation.y = Math.PI / 2;
    printer.name = "printer";
    // Add interactable parts
    printer.children.forEach(child => {
        engine.interactables.push(child);
    });
    scene.add(printer);

    // Fire Extinguisher (Mounted on North Wall near door)
    const fireExtinguisher = Prefabs.createFireExtinguisher();
    fireExtinguisher.position.set(1.5, 1.5, -halfDepth + 0.15); // Left of door
    fireExtinguisher.name = "fire_extinguisher";
    // Find hitbox
    const feHitbox = fireExtinguisher.children.find(c => c.geometry && !c.visible);
    if (feHitbox) {
        feHitbox.name = "fire_extinguisher";
        engine.interactables.push(feHitbox);
    } else {
        engine.interactables.push(fireExtinguisher.children[0]);
    }
    scene.add(fireExtinguisher);

    // Lunchbox (On round table)
    const lunchbox = Prefabs.createLunchbox();
    lunchbox.position.set(2.5, 0.75, 1.5); // On meeting table
    lunchbox.rotation.y = Math.random() * Math.PI;
    lunchbox.name = "lunchbox";
    engine.interactables.push(lunchbox.children[0]);
    scene.add(lunchbox);

    // Trophy (On top shelf of bookshelf 0)
    const trophy = Prefabs.createTrophy();
    trophy.position.set(halfWidth - 0.4, 1.6 + 0.05, -4.5); // Bookshelf 0 top shelf
    trophy.rotation.y = -Math.PI / 2;
    trophy.name = "trophy";
    // Find hitbox
    const trophyHitbox = trophy.children.find(c => c.geometry && !c.visible);
    if (trophyHitbox) {
        trophyHitbox.name = "trophy";
        engine.interactables.push(trophyHitbox);
    } else {
        engine.interactables.push(trophy.children[0]);
    }
    scene.add(trophy);

    // Radio (On bookshelf 3)
    const radio = Prefabs.createRadio();
    radio.position.set(halfWidth - 0.4, 0.8 + 0.05, 4.5); // Bookshelf 3 middle shelf
    radio.rotation.y = -Math.PI / 2;
    radio.name = "radio";
    engine.interactables.push(radio.children[0]);
    scene.add(radio);

    // Typewriter (On bookshelf 2 - bottom shelf display)
    const typewriter = Prefabs.createTypewriter();
    typewriter.position.set(halfWidth - 0.4, 0.4 + 0.05, 1.5); // Bookshelf 2 bottom shelf
    typewriter.rotation.y = -Math.PI / 2;
    typewriter.name = "typewriter";
    engine.interactables.push(typewriter.children[0]);
    scene.add(typewriter);

    // Hat (On coat rack)
    const hat = Prefabs.createHat();
    hat.position.set(2.05, 1.5, -halfDepth + 0.5); // Hanging on coat rack hook
    hat.rotation.z = -0.5; // Tilted
    hat.name = "hat";
    // Find hitbox
    const hatHitbox = hat.children.find(c => c.geometry && !c.visible);
    if (hatHitbox) {
        hatHitbox.name = "hat";
        engine.interactables.push(hatHitbox);
    } else {
        engine.interactables.push(hat.children[0]);
    }
    scene.add(hat);

    // ===== SITTING AREA (Southwest Corner) =====
    const sittingAreaX = -halfWidth + 2.5;
    const sittingAreaZ = halfDepth - 2.5;

    // Rug (foundation of the sitting area)
    const rug = Prefabs.createRug(3.0, 2.5);
    rug.position.set(sittingAreaX, 0, sittingAreaZ);
    rug.name = "rug";
    engine.interactables.push(rug);
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
    // Register only the glass top as interactable to avoid blocking items on the table
    const glassTop = coffeeTable.children.find(child => child.position.y > 0.1);
    if (glassTop) {
        glassTop.name = "coffee_table";
        engine.interactables.push(glassTop);
    } else {
        // Fallback to group
        coffeeTable.name = "coffee_table";
        engine.interactables.push(coffeeTable);
    }
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
    // Also register TV stand itself as interactable
    tvStand.children.forEach(child => {
        if (child !== tvScreen && child.geometry) {
            child.name = "tv_stand";
            engine.interactables.push(child);
        }
    });
    scene.add(tvStand);

    // Floor Lamp (beside armchair on east side)
    const floorLamp = Prefabs.createLamp('floor');
    floorLamp.position.set(sittingAreaX + 1.8, 0, sittingAreaZ - 1.0);
    // Register lamp children as interactable (shade, stem, etc.)
    floorLamp.children.forEach(child => {
        if (child.geometry) {
            child.name = "floor_lamp";
            engine.interactables.push(child);
        }
    });
    scene.add(floorLamp);

    // Coffee Cup on table (positioned above the glass surface)
    const coffeeCup = Prefabs.createCoffeeCup(0.04, 0.1);
    coffeeCup.position.set(sittingAreaX - 0.2, coffeeTableHeight + 0.05, sittingAreaZ + 0.1);
    // Register the cup body mesh (first child) as interactable
    if (coffeeCup.children.length > 0) {
        coffeeCup.children[0].name = "coffee_cup";
        engine.interactables.push(coffeeCup.children[0]);
    } else {
        coffeeCup.name = "coffee_cup";
        engine.interactables.push(coffeeCup);
    }
    scene.add(coffeeCup);

    // Newspaper on table (positioned above the glass surface)
    const newspaper = Prefabs.createNewspaper(0.3, 0.4);
    newspaper.position.set(sittingAreaX + 0.2, coffeeTableHeight + 0.05, sittingAreaZ - 0.1);
    newspaper.name = "newspaper";
    // Make the newspaper mesh itself interactable (it's the first child)
    if (newspaper.children.length > 0) {
        newspaper.children[0].name = "newspaper";
        engine.interactables.push(newspaper.children[0]);
    } else {
        engine.interactables.push(newspaper);
    }
    scene.add(newspaper);

    // Remote Control on table
    const remote = Prefabs.createRemote(0.15, 0.05);
    remote.position.set(sittingAreaX - 0.3, coffeeTableHeight, sittingAreaZ - 0.2);
    remote.rotation.y = -Math.PI / 6; // Angled
    // Find the invisible hitbox child and register it as interactable
    const remoteHitbox = remote.children.find(child => !child.visible && child.geometry);
    if (remoteHitbox) {
        remoteHitbox.name = "remote";
        engine.interactables.push(remoteHitbox);
    } else {
        // Fallback to group if no hitbox found
        remote.name = "remote";
        engine.interactables.push(remote);
    }
    scene.add(remote);

    // ===== CLUTTER & DECOR =====

    // Paper Stack on Desk
    const paperStack1 = Prefabs.createPaperStack(7);
    paperStack1.position.set(-halfWidth + 1.8, DESK_SURFACE_Y, -halfDepth + 1.2);
    paperStack1.rotation.y = Math.random() * 0.5;
    paperStack1.name = "papers_desk";
    engine.interactables.push(paperStack1); // Flavor text
    scene.add(paperStack1);

    // Cardboard Box near Filing Cabinet
    const box1 = Prefabs.createCardboardBox(0.5, 0.4, 0.5);
    box1.position.set(-halfWidth + 0.8, 0, -halfDepth + 3.8);
    box1.rotation.y = Math.random() * 0.5;
    box1.name = "box_storage";
    engine.interactables.push(box1);
    scene.add(box1);

    // Cardboard Box near Coat Rack
    const box2 = Prefabs.createCardboardBox(0.4, 0.3, 0.4);
    box2.position.set(2.5, 0, -halfDepth + 0.8);
    box2.rotation.y = Math.random() * 0.5 + 0.5;
    box2.name = "box_misc";
    engine.interactables.push(box2);
    scene.add(box2);

    // Whiteboard on West Wall
    const whiteboard = Prefabs.createWhiteboard(2.0, 1.2);
    whiteboard.position.set(-halfWidth + 0.05, 1.8, 2.5);
    whiteboard.rotation.y = Math.PI / 2;
    whiteboard.name = "whiteboard";
    engine.interactables.push(whiteboard);
    scene.add(whiteboard);

    // Scattered Books near Sitting Area
    const scatteredBooks = Prefabs.createScatteredBooks(4);
    scatteredBooks.position.set(-halfWidth + 3.5, 0, halfDepth - 1.5);
    scatteredBooks.rotation.y = Math.random() * Math.PI;
    scatteredBooks.name = "scattered_books";
    engine.interactables.push(scatteredBooks);
    scene.add(scatteredBooks);

    // ===== MEETING AREA (South East) =====
    const meetingX = 2.5;
    const meetingZ = 1.5;

    // Round Table
    const roundTable = Prefabs.createRoundTable(0.6, 0.75);
    roundTable.position.set(meetingX, 0, meetingZ);
    roundTable.name = "meeting_table";
    engine.interactables.push(roundTable);
    scene.add(roundTable);

    // Chairs around table
    const chairDist = 0.9;
    const chairAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

    chairAngles.forEach((angle, i) => {
        const chair = Prefabs.createSimpleChair();
        const cx = meetingX + Math.sin(angle) * chairDist;
        const cz = meetingZ + Math.cos(angle) * chairDist;

        chair.position.set(cx, 0, cz);
        chair.rotation.y = angle + Math.PI; // Face table
        chair.name = `meeting_chair_${i}`;
        engine.interactables.push(chair);
        scene.add(chair);
    });

    // ===== BREAK CORNER (North East) =====

    // Water Cooler
    const waterCooler = Prefabs.createWaterCooler();
    waterCooler.position.set(4.0, 0, -4.0);
    waterCooler.rotation.y = -Math.PI / 4; // Angled into room
    waterCooler.name = "water_cooler";
    engine.interactables.push(waterCooler);
    scene.add(waterCooler);

    // Corkboard on South Wall
    const corkboard = Prefabs.createCorkboard(1.2, 0.8);
    corkboard.position.set(3.0, 1.8, halfDepth - 0.05);
    corkboard.rotation.y = Math.PI; // Face North
    corkboard.name = "corkboard";
    engine.interactables.push(corkboard);
    scene.add(corkboard);

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
            secretBookshelfPivot.position.set(halfWidth - shelfDepth / 2 - 0.3, 0, config.z - shelfWidth / 2);
            scene.add(secretBookshelfPivot);

            // Create bookshelf with pre-populated books and add to pivot
            bookshelf = Prefabs.createBookshelf(shelfWidth, shelfHeight, shelfDepth, numShelves);
            bookshelf.position.set(0, 0, shelfWidth / 2); // Offset from pivot point
            bookshelf.rotation.y = -Math.PI / 2; // Rotate to face west (into room)
            secretBookshelfPivot.add(bookshelf);

            // Register shelf rows as interactables
            registerBookshelfInteractables(bookshelf, engine, "secret_bookshelf");
        } else {
            // Normal static bookshelf with pre-populated books
            bookshelf = Prefabs.createBookshelf(shelfWidth, shelfHeight, shelfDepth, numShelves);
            bookshelf.position.set(halfWidth - shelfDepth / 2 - 0.3, 0, config.z);
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
    const hiddenRoomX = halfWidth + hiddenRoomWidth / 2 + 0.2; // Beyond the east wall
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
    hiddenBackWall.position.set(hiddenRoomX, hiddenRoomHeight / 2, hiddenRoomZ);
    hiddenBackWall.rotation.y = Math.PI / 2;
    hiddenBackWall.castShadow = true;
    hiddenBackWall.receiveShadow = true;
    scene.add(hiddenBackWall);

    // Hidden room side walls (north and south)
    const hiddenSideWall1 = new THREE.Mesh(
        new THREE.BoxGeometry(hiddenRoomDepth, hiddenRoomHeight, WALL_THICKNESS),
        hiddenRoomMaterial
    );
    hiddenSideWall1.position.set(hiddenRoomX, hiddenRoomHeight / 2, hiddenRoomZ + hiddenRoomDepth / 2);
    hiddenSideWall1.castShadow = true;
    hiddenSideWall1.receiveShadow = true;
    scene.add(hiddenSideWall1);

    const hiddenSideWall2 = new THREE.Mesh(
        new THREE.BoxGeometry(hiddenRoomDepth, hiddenRoomHeight, WALL_THICKNESS),
        hiddenRoomMaterial
    );
    hiddenSideWall2.position.set(hiddenRoomX, hiddenRoomHeight / 2, hiddenRoomZ - hiddenRoomDepth / 2);
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
        },
        tvScreen,
        shredder
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

// Show Paper Shredder Puzzle
function showShredderPuzzle(officeState) {
    showModal('shredder_puzzle', {});

    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const optionsContainer = document.getElementById('optionsContainer');

    modalTitle.textContent = "PAPER SHREDDER";
    optionsContainer.innerHTML = ""; // Clear default buttons

    if (officeState.shredderSolved) {
        modalContent.innerHTML = `<p style="color: #4caf50; font-weight: bold;">REASSEMBLED NOTE:</p>
        <div style="background: white; color: black; padding: 20px; font-family: monospace; font-size: 24px; text-align: center; border: 1px solid #ccc; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            TURN ON THE TV
        </div>`;
        return;
    }

    modalContent.innerHTML = `
        <p>There are shredded strips of paper in the bin. Can you piece them together?</p>
        <div id="shredder-container" style="
            width: 300px;
            height: 100px;
            background: #333;
            margin: 20px auto;
            position: relative;
            display: flex;
            border: 2px solid #555;
            user-select: none;
        "></div>
        <p style="font-size: 12px; color: #888;">Drag and drop strips to rearrange.</p>
    `;

    // Initialize Puzzle Logic
    setTimeout(() => {
        initShredderPuzzleLogic(officeState);
    }, 100);
}

function initShredderPuzzleLogic(officeState) {
    const container = document.getElementById('shredder-container');
    if (!container) return;

    const numStrips = 10;
    const stripWidth = 300 / numStrips;
    const correctOrder = Array.from({ length: numStrips }, (_, i) => i);
    let currentOrder = [...correctOrder].sort(() => Math.random() - 0.5);

    // Create strips
    // We'll use a data URI for the background image text
    // "TURN ON THE TV"
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#f5f5dc"; // Paper color
    ctx.fillRect(0, 0, 300, 100);
    ctx.font = "bold 30px monospace";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TURN ON THE TV", 150, 50);

    // Add some noise lines to look like paper (seeded for consistency)
    ctx.strokeStyle = "#ddd";
    let seed = 42;
    const seededRandom = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(0, seededRandom() * 100);
        ctx.lineTo(300, seededRandom() * 100);
        ctx.stroke();
    }

    const bgUrl = canvas.toDataURL();

    function renderStrips() {
        container.innerHTML = "";
        currentOrder.forEach((originalIndex, displayIndex) => {
            const strip = document.createElement('div');
            strip.style.width = `${stripWidth}px`;
            strip.style.height = "100%";
            strip.style.backgroundImage = `url(${bgUrl})`;
            strip.style.backgroundPosition = `-${originalIndex * stripWidth}px 0`;
            strip.style.borderLeft = "1px solid rgba(0,0,0,0.1)";
            strip.style.borderRight = "1px solid rgba(0,0,0,0.1)";
            strip.style.cursor = "grab";
            strip.draggable = true;

            // Drag events
            strip.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', displayIndex);
                strip.style.opacity = '0.5';
            });

            strip.addEventListener('dragend', () => {
                strip.style.opacity = '1';
            });

            strip.addEventListener('dragover', (e) => {
                e.preventDefault(); // Allow drop
            });

            strip.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = displayIndex;

                if (fromIndex !== toIndex) {
                    // Swap items
                    const temp = currentOrder[fromIndex];
                    currentOrder[fromIndex] = currentOrder[toIndex];
                    currentOrder[toIndex] = temp;
                    renderStrips();
                    checkWin();
                }
            });

            container.appendChild(strip);
        });
    }

    function checkWin() {
        const isWin = currentOrder.every((val, index) => val === correctOrder[index]);
        if (isWin) {
            officeState.shredderSolved = true;
            const feedback = document.getElementById('modalFeedback');
            if (feedback) {
                feedback.style.color = '#4caf50';
                feedback.innerHTML = "<strong>PUZZLE SOLVED!</strong>";
                // Optionally auto-close or update UI after a delay
                setTimeout(() => {
                    showShredderPuzzle(officeState); // Re-render with success state
                }, 1000);
            }
        }
    }

    renderStrips();
}

// Initialize the office
async function initOffice() {
    // Office scene data (will be set after building scene)
    let officeData = null;
    const officeState = { shredderSolved: false };

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
            // Handle Shredder
            if (name === 'shredder' || name === 'shredder_hitbox') {
                showShredderPuzzle(officeState);
                return;
            }
            // Handle Remote
            if (name === 'remote') {
                if (officeState.shredderSolved) {
                    // Turn on TV
                    if (officeData.tvScreen) {
                        officeData.tvScreen.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green Screen
                        // Better: Draw a clue on canvas texture
                        const canvas = document.createElement('canvas');
                        canvas.width = 512;
                        canvas.height = 256;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = "black";
                        ctx.fillRect(0, 0, 512, 256);
                        ctx.fillStyle = "#00ff00";
                        ctx.font = "bold 60px monospace";
                        ctx.textAlign = "center";
                        ctx.fillText("CLUE:", 256, 100);
                        ctx.fillText("BLUE BOOK", 256, 180);

                        const texture = new THREE.CanvasTexture(canvas);
                        officeData.tvScreen.material = new THREE.MeshBasicMaterial({ map: texture });
                    }
                    showModal('generic', {});
                    const modalTitle = document.getElementById('modalTitle');
                    const modalContent = document.getElementById('modalContent');
                    modalTitle.textContent = "TV ON";
                    modalContent.innerHTML = "<p>The TV flickers to life.</p><p>It displays a message.</p>";
                } else {
                    // Locked
                    showModal('generic', {});
                    const modalTitle = document.getElementById('modalTitle');
                    const modalContent = document.getElementById('modalContent');
                    modalTitle.textContent = "REMOTE";
                    modalContent.innerHTML = "<p>It doesn't seem to work right now.</p><p style='font-style:italic; font-size: 0.9em; color:#888;'>Maybe I don't have a reason to watch TV yet.</p>";
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
    gameLogic.initGame();

    // Store original room bounds
    const originalBounds = { ...engine.roomBounds };

    // Add drawer and secret bookshelf animation to the render loop
    const originalAnimate = engine.animate.bind(engine);
    engine.animate = function (time) {
        originalAnimate(time);
        // Animate drawers (deltaTime is approximately 1/60 for 60fps)
        animateDrawers(desk, 1 / 60);
        // Animate secret bookshelf
        animateSecretBookshelf(secretBookshelfPivot, getSecretBookshelfState(), 1 / 60);

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
    if (window.__DEV__) {
        window.gameLogic = gameLogic;
    }
}

// Start
initOffice();

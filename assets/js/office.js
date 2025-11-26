import * as THREE from 'three';
import { loadModel } from './modelLoader.js';
import { createDesk } from './prefabs/desk.js';
import { createClock } from './prefabs/clock.js';
import { createBox, interactables } from './utils.js';
import { mat } from './materials.js';

// Height Constants
const DESK_SURFACE_Y = 0.75;
const CABINET_TOP_Y = 0.8;
const COFFEE_TABLE_Y = 0.35;
const BOOKSHELF_HEIGHTS = [0.4, 0.8, 1.2, 1.6];
const WALL_MOUNT_Y = 2.5;

// Executive Office Layout
export async function initOffice(scene) {
    console.log("Initializing Office Scene...");

    // 1. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(5, 5, 0);
    scene.add(spotLight);

    // 2. Flooring (Rug/Carpet style)
    const floor = await loadModel('assets/models/floorFull.glb');
    if (floor) {
        for (let x = -2; x <= 2; x+=2) {
            for (let z = -2; z <= 2; z+=2) {
                const tile = floor.clone();
                tile.position.set(x, 0, z);
                scene.add(tile);
            }
        }
    }

    // 3. Walls (Modern Office)
    const wallModel = await loadModel('assets/models/wall.glb');
    const wallCorner = await loadModel('assets/models/wallCorner.glb');

    if (wallModel) {
        // Simple 6x6 room
        const ROOM_SIZE = 6;
        const placeWall = (x, z, ry) => {
            const w = wallModel.clone();
            w.position.set(x, 0, z);
            w.rotation.y = ry;
            scene.add(w);
        };

        // Back Wall
        for (let x = -1; x <= 1; x += 2) {
            placeWall(x, -ROOM_SIZE / 2, 0);
        }

        // Front Wall
        for (let x = -1; x <= 1; x += 2) {
            placeWall(x, ROOM_SIZE / 2, Math.PI);
        }

        // Left Wall
        for (let z = -1; z <= 1; z += 2) {
            placeWall(-ROOM_SIZE / 2, z, Math.PI / 2);
        }

        // Right Wall
        for (let z = -1; z <= 1; z += 2) {
            placeWall(ROOM_SIZE / 2, z, -Math.PI / 2);
        }

        // Corners
        if (wallCorner) {
            const corner1 = wallCorner.clone();
            corner1.position.set(-ROOM_SIZE/2, 0, -ROOM_SIZE/2);
            corner1.rotation.y = 0;
            scene.add(corner1);

            const corner2 = wallCorner.clone();
            corner2.position.set(ROOM_SIZE/2, 0, -ROOM_SIZE/2);
            corner2.rotation.y = -Math.PI/2;
            scene.add(corner2);

            const corner3 = wallCorner.clone();
            corner3.position.set(-ROOM_SIZE/2, 0, ROOM_SIZE/2);
            corner3.rotation.y = Math.PI/2;
            scene.add(corner3);

            const corner4 = wallCorner.clone();
            corner4.position.set(ROOM_SIZE/2, 0, ROOM_SIZE/2);
            corner4.rotation.y = Math.PI;
            scene.add(corner4);
        }
    }

    // ========================================
    // ZONE 1: EXECUTIVE WORK AREA
    // ========================================

    // Desk
    const desk = await loadModel('assets/models/desk.glb');
    if (desk) {
        desk.position.set(-1.5, 0, -1.8);
        desk.rotation.y = 0;
        scene.add(desk);
    }

    // Executive Chair
    const chair = await loadModel('assets/models/chairDesk.glb');
    if (chair) {
        chair.position.set(-1.5, 0, -0.8);
        chair.rotation.y = Math.PI; // Facing desk
        scene.add(chair);
    }

    // Computer Screen
    const computerScreen = await loadModel('assets/models/computerScreen.glb');
    if (computerScreen) {
        computerScreen.position.set(-1.5, DESK_SURFACE_Y, -2.0);
        computerScreen.rotation.y = 0;
        computerScreen.name = "computer";
        interactables.push(computerScreen);
        scene.add(computerScreen);
    }

    // Keyboard
    const keyboard = await loadModel('assets/models/computerKeyboard.glb');
    if (keyboard) {
        keyboard.position.set(-1.5, DESK_SURFACE_Y, -1.6);
        keyboard.rotation.y = 0;
        keyboard.name = "keyboard";
        interactables.push(keyboard);
        scene.add(keyboard);
    }

    // Mouse
    const mouse = await loadModel('assets/models/computerMouse.glb');
    if (mouse) {
        mouse.position.set(-1.0, DESK_SURFACE_Y, -1.6);
        mouse.rotation.y = 0;
        mouse.name = "mouse";
        interactables.push(mouse);
        scene.add(mouse);
    }

    // Desk Lamp
    const deskLamp = await loadModel('assets/models/lampSquareTable.glb');
    if (deskLamp) {
        deskLamp.position.set(-2.2, DESK_SURFACE_Y, -1.8);
        deskLamp.rotation.y = Math.PI / 4;
        scene.add(deskLamp);
    }

    // Laptop (additional item on desk)
    const laptop = await loadModel('assets/models/laptop.glb');
    if (laptop) {
        laptop.position.set(-0.8, DESK_SURFACE_Y, -2.0);
        laptop.rotation.y = -Math.PI / 6;
        scene.add(laptop);
    }

    // Trash Can
    const trash = await loadModel('assets/models/trashcan.glb');
    if (trash) {
        trash.position.set(-2.3, 0, -1.2);
        trash.rotation.y = 0;
        trash.name = "trash";
        interactables.push(trash);
        scene.add(trash);
    }

    // ========================================
    // ZONE 2: STORAGE WALL
    // ========================================

    // Filing Cabinet 1
    const filingCabinet1 = await loadModel('assets/models/kitchenCabinetDrawer.glb');
    if (filingCabinet1) {
        filingCabinet1.position.set(-0.5, 0, -2.8);
        filingCabinet1.rotation.y = 0;
        filingCabinet1.name = "filing_cabinet_1";
        interactables.push(filingCabinet1);
        scene.add(filingCabinet1);
    }

    // Filing Cabinet 2
    const filingCabinet2 = await loadModel('assets/models/kitchenCabinetDrawer.glb');
    if (filingCabinet2) {
        filingCabinet2.position.set(0.5, 0, -2.8);
        filingCabinet2.rotation.y = 0;
        filingCabinet2.name = "filing_cabinet_2";
        interactables.push(filingCabinet2);
        scene.add(filingCabinet2);
    }

    // Filing Cabinet 3
    const filingCabinet3 = await loadModel('assets/models/kitchenCabinetDrawer.glb');
    if (filingCabinet3) {
        filingCabinet3.position.set(1.5, 0, -2.8);
        filingCabinet3.rotation.y = 0;
        filingCabinet3.name = "filing_cabinet_3";
        interactables.push(filingCabinet3);
        scene.add(filingCabinet3);
    }

    // Papers Stack (on Cabinet 2)
    const papersGroup = new THREE.Group();
    papersGroup.position.set(0.5, CABINET_TOP_Y, -2.7);
    for (let i = 0; i < 10; i++) {
        const paper = new THREE.Mesh(
            new THREE.PlaneGeometry(0.25, 0.35),
            mat.paper
        );
        paper.rotation.x = -Math.PI / 2;
        paper.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.05;
        paper.position.y = i * 0.005;
        papersGroup.add(paper);
    }
    const topPaper = papersGroup.children[papersGroup.children.length - 1];
    topPaper.name = "papers";
    interactables.push(topPaper);
    scene.add(papersGroup);

    // Globe (on Cabinet 1)
    const globeGroup = new THREE.Group();
    globeGroup.position.set(-0.5, CABINET_TOP_Y + 0.03, -2.7);

    const globeBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 })
    );
    globeBase.position.y = -0.28;
    globeGroup.add(globeBase);

    const globeSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0x4682B4, roughness: 0.6 })
    );
    globeSphere.name = "globe";
    interactables.push(globeSphere);
    globeGroup.add(globeSphere);
    scene.add(globeGroup);

    // ========================================
    // ZONE 3: BOOKSHELF & LIBRARY AREA
    // ========================================

    // Bookshelf
    const bookshelf = await loadModel('assets/models/bookcaseOpen.glb');
    if (bookshelf) {
        bookshelf.position.set(2.5, 0, -2.0);
        bookshelf.rotation.y = -Math.PI / 2; // Facing left into room
        scene.add(bookshelf);
    }

    // Book Cluster 1 (Bottom Shelf)
    const bookCluster1 = await loadModel('assets/models/books.glb');
    if (bookCluster1) {
        bookCluster1.position.set(2.3, BOOKSHELF_HEIGHTS[0], -2.0);
        bookCluster1.rotation.y = 0;
        bookCluster1.name = "book_cluster_1";
        interactables.push(bookCluster1);
        scene.add(bookCluster1);
    }

    // Book Cluster 2
    const bookCluster2 = await loadModel('assets/models/books.glb');
    if (bookCluster2) {
        bookCluster2.position.set(2.3, BOOKSHELF_HEIGHTS[1], -2.0);
        bookCluster2.rotation.y = Math.PI / 4;
        bookCluster2.name = "book_cluster_2";
        interactables.push(bookCluster2);
        scene.add(bookCluster2);
    }

    // Book Cluster 3
    const bookCluster3 = await loadModel('assets/models/books.glb');
    if (bookCluster3) {
        bookCluster3.position.set(2.3, BOOKSHELF_HEIGHTS[2], -1.9);
        bookCluster3.rotation.y = -Math.PI / 6;
        bookCluster3.name = "book_cluster_3";
        interactables.push(bookCluster3);
        scene.add(bookCluster3);
    }

    // Book Cluster 4 (Upper Shelf)
    const bookCluster4 = await loadModel('assets/models/books.glb');
    if (bookCluster4) {
        bookCluster4.position.set(2.3, BOOKSHELF_HEIGHTS[3], -2.1);
        bookCluster4.rotation.y = Math.PI / 3;
        bookCluster4.name = "book_cluster_4";
        interactables.push(bookCluster4);
        scene.add(bookCluster4);
    }

    // ========================================
    // ZONE 4: LOUNGE/MEETING AREA
    // ========================================

    // Rug
    const rug = await loadModel('assets/models/rugRounded.glb');
    if (rug) {
        rug.position.set(-1.5, 0.01, 1.5);
        rug.rotation.y = 0;
        scene.add(rug);
    }

    // Sofa
    const sofa = await loadModel('assets/models/loungeSofa.glb');
    if (sofa) {
        sofa.position.set(-1.5, 0, 2.2);
        sofa.rotation.y = 0; // Facing toward center
        scene.add(sofa);
    }

    // Coffee Table
    const coffeeTable = await loadModel('assets/models/tableCoffeeGlass.glb');
    if (coffeeTable) {
        coffeeTable.position.set(-1.5, 0, 0.8);
        scene.add(coffeeTable);
    }

    // Briefcase (on Coffee Table)
    const briefcaseGroup = new THREE.Group();
    briefcaseGroup.position.set(-1.2, 0, 0.8);
    briefcaseGroup.rotation.y = 0.3;

    const briefcaseBody = createBox(0.6, 0.4, 0.15, mat.leather, 0, COFFEE_TABLE_Y + 0.02, 0, briefcaseGroup, 0, 0, 0, "briefcase");
    createBox(0.02, 0.1, 0.1, mat.chrome, 0, COFFEE_TABLE_Y + 0.22, 0, briefcaseGroup); // Handle
    scene.add(briefcaseGroup);

    // Floor Lamp
    const floorLamp = await loadModel('assets/models/lampRoundFloor.glb');
    if (floorLamp) {
        floorLamp.position.set(-2.3, 0, 2.2);
        scene.add(floorLamp);
    }

    // ========================================
    // ZONE 5: SPECIAL ITEMS & DECORATIONS
    // ========================================

    // Safe (Front Right Corner)
    const safeGroup = new THREE.Group();
    safeGroup.position.set(2.5, 0, 2.5);
    safeGroup.rotation.y = -Math.PI / 4;

    const safeBox = createBox(0.8, 1.0, 0.8, mat.safe, 0, 0.5, 0, safeGroup, 0, 0, 0, "safe");

    // Safe Dial
    const safeDial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: 0xcccccc })
    );
    safeDial.rotation.x = Math.PI / 2;
    safeDial.position.set(0, 0.2, 0.41);
    safeBox.add(safeDial);

    // Safe Handle
    createBox(0.05, 0.2, 0.05, 0xcccccc, 0.2, 0, 0.45, safeBox);

    // Door Seam
    createBox(0.7, 0.9, 0.02, 0x222222, 0, 0, 0.405, safeBox);

    scene.add(safeGroup);

    // Clock (Wall Mounted - Back Wall Center)
    createClock(scene, new THREE.Vector3(0, WALL_MOUNT_Y, -2.95), new THREE.Euler(0, 0, 0));

    // Potted Plant (Back Left Corner)
    const plant1 = await loadModel('assets/models/pottedPlant.glb');
    if (plant1) {
        plant1.position.set(-2.7, 0, -2.7);
        plant1.name = "plant";
        interactables.push(plant1);
        scene.add(plant1);
    }

    // Small Plant (Near Safe)
    const plant2 = await loadModel('assets/models/plantSmall1.glb');
    if (plant2) {
        plant2.position.set(2.3, 0, 2.0);
        scene.add(plant2);
    }

    // Coat Rack
    const coatRack = await loadModel('assets/models/coatRackStanding.glb');
    if (coatRack) {
        coatRack.position.set(-2.7, 0, -1.8);
        scene.add(coatRack);
    }

    console.log("Office Scene Loaded - " + interactables.length + " interactable objects");
}

import * as THREE from 'three';
import { loadModel } from './modelLoader.js';
import { createDesk } from './prefabs/desk.js';
import { createClock } from './prefabs/clock.js';
import { createBox, interactables } from './utils.js';
import { mat } from './materials.js';

import { WALL_HEIGHT } from './constants.js';

// Height Constants
const DESK_SURFACE_Y = 0.75;
const CABINET_TOP_Y = 0.8;
const COFFEE_TABLE_Y = 0.35;
const BOOKSHELF_HEIGHTS = [0.4, 0.8, 1.2, 1.6];
const WALL_MOUNT_Y = 2.5;
const ROOM_SIZE = 6;

// Helper to load models with error handling
async function loadModelSafe(path) {
    try {
        return await loadModel(path);
    } catch (err) {
        console.warn(`Failed to load ${path}:`, err.message);
        return null;
    }
}

// Executive Office Layout
export async function initOffice(scene) {
    console.log("Initializing Office Scene...");

    // 1. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(5, 5, 0);
    scene.add(spotLight);

    // 2. Flooring
    const floor = await loadModelSafe('assets/models/floorFull.glb');
    if (floor) {
        // Reduced grid step to 1 for gapless flooring
        for (let x = -ROOM_SIZE / 2; x < ROOM_SIZE / 2; x += 1) {
            for (let z = -ROOM_SIZE / 2; z < ROOM_SIZE / 2; z += 1) {
                const tile = floor.clone();
                tile.position.set(x + 0.5, 0, z + 0.5); // Center 0.5, 0.5 for range [0, 1] relative to grid
                scene.add(tile);
            }
        }
    }

    // 3. Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(ROOM_SIZE + 0.1, ROOM_SIZE + 0.1);
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_HEIGHT;
    scene.add(ceiling);

    // 4. Walls
    const wallModel = await loadModelSafe('assets/models/wall.glb');
    const wallCorner = await loadModelSafe('assets/models/wallCorner.glb');

    if (wallModel) {
        const placeWall = (x, z, ry) => {
            const w = wallModel.clone();
            w.position.set(x, 0, z);
            w.scale.y = WALL_HEIGHT; // Scale to reach ceiling
            w.rotation.y = ry;
            w.userData.isWall = true;
            scene.add(w);
        };

        // Walls - Step 1 to fill gaps
        // Range [-2.5, 2.5]
        for (let x = -ROOM_SIZE/2 + 0.5; x <= ROOM_SIZE/2 - 0.5; x += 1) {
             placeWall(x, -ROOM_SIZE / 2, 0); // Back
             placeWall(x, ROOM_SIZE / 2, Math.PI); // Front
        }
        for (let z = -ROOM_SIZE/2 + 0.5; z <= ROOM_SIZE/2 - 0.5; z += 1) {
             placeWall(-ROOM_SIZE / 2, z, Math.PI / 2); // Left
             placeWall(ROOM_SIZE / 2, z, -Math.PI / 2); // Right
        }

        // Corners
        if (wallCorner) {
            const corners = [
                [-ROOM_SIZE/2, -ROOM_SIZE/2, 0],
                [ROOM_SIZE/2, -ROOM_SIZE/2, -Math.PI/2],
                [-ROOM_SIZE/2, ROOM_SIZE/2, Math.PI/2],
                [ROOM_SIZE/2, ROOM_SIZE/2, Math.PI]
            ];
            corners.forEach(([x, z, ry]) => {
                const corner = wallCorner.clone();
                corner.position.set(x, 0, z);
                corner.scale.y = WALL_HEIGHT;
                corner.rotation.y = ry;
                corner.userData.isWall = true;
                scene.add(corner);
            });
        }
    }

    // ZONE 1: EXECUTIVE WORK AREA
    const desk = await loadModelSafe('assets/models/desk.glb');
    if (desk) {
        desk.position.set(-1.5, 0, -1.8);
        scene.add(desk);
    }

    const chair = await loadModelSafe('assets/models/chairDesk.glb');
    if (chair) {
        chair.position.set(-1.5, 0, -0.8);
        chair.rotation.y = Math.PI;
        scene.add(chair);
    }

    const computerScreen = await loadModelSafe('assets/models/computerScreen.glb');
    if (computerScreen) {
        computerScreen.position.set(-1.5, DESK_SURFACE_Y, -2.0);
        computerScreen.name = "computer";
        interactables.push(computerScreen);
        scene.add(computerScreen);
    }

    const keyboard = await loadModelSafe('assets/models/computerKeyboard.glb');
    if (keyboard) {
        keyboard.position.set(-1.5, DESK_SURFACE_Y, -1.6);
        keyboard.name = "keyboard";
        interactables.push(keyboard);
        scene.add(keyboard);
    }

    const mouse = await loadModelSafe('assets/models/computerMouse.glb');
    if (mouse) {
        mouse.position.set(-1.0, DESK_SURFACE_Y, -1.6);
        mouse.name = "mouse";
        interactables.push(mouse);
        scene.add(mouse);
    }

    const deskLamp = await loadModelSafe('assets/models/lampSquareTable.glb');
    if (deskLamp) {
        deskLamp.position.set(-2.2, DESK_SURFACE_Y, -1.8);
        deskLamp.rotation.y = Math.PI / 4;
        scene.add(deskLamp);
    }

    const laptop = await loadModelSafe('assets/models/laptop.glb');
    if (laptop) {
        laptop.position.set(-0.8, DESK_SURFACE_Y, -2.0);
        laptop.rotation.y = -Math.PI / 6;
        scene.add(laptop);
    }

    const trash = await loadModelSafe('assets/models/trashcan.glb');
    if (trash) {
        trash.position.set(-2.3, 0, -1.2);
        trash.name = "trash";
        interactables.push(trash);
        scene.add(trash);
    }

    // ZONE 2: STORAGE WALL
    const filingCabinet1 = await loadModelSafe('assets/models/kitchenCabinetDrawer.glb');
    if (filingCabinet1) {
        filingCabinet1.position.set(-0.5, 0, -2.8);
        filingCabinet1.name = "filing_cabinet_1";
        interactables.push(filingCabinet1);
        scene.add(filingCabinet1);
    }

    const filingCabinet2 = await loadModelSafe('assets/models/kitchenCabinetDrawer.glb');
    if (filingCabinet2) {
        filingCabinet2.position.set(0.5, 0, -2.8);
        filingCabinet2.name = "filing_cabinet_2";
        interactables.push(filingCabinet2);
        scene.add(filingCabinet2);
    }

    const filingCabinet3 = await loadModelSafe('assets/models/kitchenCabinetDrawer.glb');
    if (filingCabinet3) {
        filingCabinet3.position.set(1.5, 0, -2.8);
        filingCabinet3.name = "filing_cabinet_3";
        interactables.push(filingCabinet3);
        scene.add(filingCabinet3);
    }

    // Papers Stack
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

    // Globe
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

    // ZONE 3: BOOKSHELF & LIBRARY AREA
    const bookshelf = await loadModelSafe('assets/models/bookcaseOpen.glb');
    if (bookshelf) {
        bookshelf.position.set(2.5, 0, -2.0);
        bookshelf.rotation.y = Math.PI / 2;
        scene.add(bookshelf);
    }

    const bookCluster1 = await loadModelSafe('assets/models/books.glb');
    if (bookCluster1) {
        bookCluster1.position.set(2.3, BOOKSHELF_HEIGHTS[0], -2.0);
        bookCluster1.name = "book_cluster_1";
        interactables.push(bookCluster1);
        scene.add(bookCluster1);
    }

    const bookCluster2 = await loadModelSafe('assets/models/books.glb');
    if (bookCluster2) {
        bookCluster2.position.set(2.3, BOOKSHELF_HEIGHTS[1], -2.0);
        bookCluster2.rotation.y = Math.PI / 4;
        bookCluster2.name = "book_cluster_2";
        interactables.push(bookCluster2);
        scene.add(bookCluster2);
    }

    const bookCluster3 = await loadModelSafe('assets/models/books.glb');
    if (bookCluster3) {
        bookCluster3.position.set(2.3, BOOKSHELF_HEIGHTS[2], -1.9);
        bookCluster3.rotation.y = -Math.PI / 6;
        bookCluster3.name = "book_cluster_3";
        interactables.push(bookCluster3);
        scene.add(bookCluster3);
    }

    const bookCluster4 = await loadModelSafe('assets/models/books.glb');
    if (bookCluster4) {
        bookCluster4.position.set(2.3, BOOKSHELF_HEIGHTS[3], -2.1);
        bookCluster4.rotation.y = Math.PI / 3;
        bookCluster4.name = "book_cluster_4";
        interactables.push(bookCluster4);
        scene.add(bookCluster4);
    }

    // ZONE 4: LOUNGE/MEETING AREA
    const rug = await loadModelSafe('assets/models/rugRounded.glb');
    if (rug) {
        rug.position.set(-1.5, 0.01, 1.5);
        scene.add(rug);
    }

    const sofa = await loadModelSafe('assets/models/loungeSofa.glb');
    if (sofa) {
        sofa.position.set(-1.5, 0, 2.2);
        sofa.rotation.y = Math.PI;
        scene.add(sofa);
    }

    const coffeeTable = await loadModelSafe('assets/models/tableCoffeeGlass.glb');
    if (coffeeTable) {
        coffeeTable.position.set(-1.5, 0, 0.8);
        scene.add(coffeeTable);
    }

    // Briefcase
    const briefcaseGroup = new THREE.Group();
    briefcaseGroup.position.set(-1.2, 0, 0.8);
    briefcaseGroup.rotation.y = 0.3;
    createBox(0.6, 0.4, 0.15, mat.leather, 0, COFFEE_TABLE_Y + 0.02, 0, briefcaseGroup, 0, 0, 0, "briefcase");
    createBox(0.02, 0.1, 0.1, mat.chrome, 0, COFFEE_TABLE_Y + 0.22, 0, briefcaseGroup);
    scene.add(briefcaseGroup);

    const floorLamp = await loadModelSafe('assets/models/lampRoundFloor.glb');
    if (floorLamp) {
        floorLamp.position.set(-2.3, 0, 2.2);
        scene.add(floorLamp);
    }

    // ZONE 5: SPECIAL ITEMS & DECORATIONS
    // Safe
    const safeGroup = new THREE.Group();
    safeGroup.position.set(2.5, 0, 2.5);
    safeGroup.rotation.y = 3 * Math.PI / 4;
    const safeBox = createBox(0.8, 1.0, 0.8, mat.safe, 0, 0.5, 0, safeGroup, 0, 0, 0, "safe");
    const safeDial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: 0xcccccc })
    );
    safeDial.rotation.x = Math.PI / 2;
    safeDial.position.set(0, 0.2, 0.41);
    safeBox.add(safeDial);
    createBox(0.05, 0.2, 0.05, 0xcccccc, 0.2, 0, 0.45, safeBox);
    createBox(0.7, 0.9, 0.02, 0x222222, 0, 0, 0.405, safeBox);
    scene.add(safeGroup);

    // Clock
    createClock(scene, new THREE.Vector3(0, WALL_MOUNT_Y, -2.95), new THREE.Euler(0, 0, 0));

    // Plants
    const plant1 = await loadModelSafe('assets/models/pottedPlant.glb');
    if (plant1) {
        plant1.position.set(-2.7, 0, -2.7);
        plant1.name = "plant";
        interactables.push(plant1);
        scene.add(plant1);
    }

    const plant2 = await loadModelSafe('assets/models/plantSmall1.glb');
    if (plant2) {
        plant2.position.set(2.3, 0, 2.0);
        scene.add(plant2);
    }

    // Coat Rack
    const coatRack = await loadModelSafe('assets/models/coatRackStanding.glb');
    if (coatRack) {
        coatRack.position.set(-2.7, 0, -1.8);
        scene.add(coatRack);
    }

    console.log("Office Scene Loaded - " + interactables.length + " interactable objects");
}

import * as THREE from 'three';
import { loadModel } from './modelLoader.js';
import { createDesk } from './prefabs/desk.js';

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

    // 4. Executive Desk (Corner Desk)
    const deskCorner = await loadModel('assets/models/deskCorner.glb');
    if (deskCorner) {
        deskCorner.position.set(-2, 0, -2);
        deskCorner.rotation.y = Math.PI / 4; // Angled in corner
        scene.add(deskCorner);

        // Add chair behind it
        const chair = await loadModel('assets/models/chairModernFrameCushion.glb');
        if (chair) {
            chair.position.set(-2.5, 0, -2.5);
            chair.rotation.y = Math.PI / 4;
            chair.lookAt(deskCorner.position);
            scene.add(chair);
        }

        // Laptop on desk
        const laptop = await loadModel('assets/models/laptop.glb');
        if (laptop) {
            // Approx height for deskCorner is usually 0.75
            laptop.position.set(-2, 0.75, -2);
            laptop.rotation.y = Math.PI / 4 + Math.PI; // Face user
            scene.add(laptop);
        }
    }

    // 5. Lounge Area
    const sofa = await loadModel('assets/models/loungeSofa.glb');
    if (sofa) {
        sofa.position.set(2, 0, 1);
        sofa.rotation.y = -Math.PI / 2;
        scene.add(sofa);
    }

    const coffeeTable = await loadModel('assets/models/tableCoffeeGlass.glb');
    if (coffeeTable) {
        coffeeTable.position.set(0.5, 0, 1);
        scene.add(coffeeTable);
    }
    
    const plant = await loadModel('assets/models/pottedPlant.glb');
    if (plant) {
        plant.position.set(2.5, 0, -2.5);
        scene.add(plant);
    }
}
/**
 * science_lab.js
 * Main entry point for the Science Lab Escape Room.
 */

console.log("science_lab.js loaded");
import * as THREE from 'three';
import {
    ROOM_SIZE,
    WALL_HEIGHT,
    CAMERA_HEIGHT,
    TIMER_DURATION,
    LOOK_SPEED,
    MOVE_SPEED,
    MOUSE_LOOK_SPEED,
    MIN_POLAR_ANGLE,
    MAX_POLAR_ANGLE,
    SCENE_BACKGROUND_COLOR,
    FOG_COLOR,
    FOG_NEAR,
    FOG_FAR
} from './constants.js';
import { TouchControls } from './touchControls.js';
import { closeModal, isInteracting, initInventoryUI } from './ui.js'; // We will add initInventoryUI to ui.js
import { addItem } from './inventory.js';

// --- CONSTANTS ---
const interactables = [];
let gameWon = false;
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _PI_2 = Math.PI / 2;
const _vector = new THREE.Vector3();

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a); // Darker, more "lab-like" background
scene.fog = new THREE.Fog(0x1a1a1a, 2, 15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, CAMERA_HEIGHT, 0);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft white light
scene.add(ambientLight);

// Cool blueish lab light
const labLight = new THREE.PointLight(0x00ffff, 0.5, 10);
labLight.position.set(0, 3, 0);
scene.add(labLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(-2, 5, -2);
dirLight.castShadow = true;
scene.add(dirLight);

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- LAB ROOM GENERATION ---
// Using a custom room setup for the lab
const roomGroup = new THREE.Group();
scene.add(roomGroup);

// Floor (Tiled)
const floorGeo = new THREE.PlaneGeometry(10, 10);
const floorMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.2,
    metalness: 0.1
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
roomGroup.add(floor);

// Ceiling
const ceilingGeo = new THREE.PlaneGeometry(10, 10);
const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = WALL_HEIGHT;
roomGroup.add(ceiling);

// Walls
const wallMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
function createWall(x, y, z, w, h, d) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, y, z);
    wall.receiveShadow = true;
    wall.castShadow = true;
    roomGroup.add(wall);
}

// Back Wall
createWall(0, WALL_HEIGHT / 2, -5, 10, WALL_HEIGHT, 0.5);
// Front Wall
createWall(0, WALL_HEIGHT / 2, 5, 10, WALL_HEIGHT, 0.5);
// Left Wall
createWall(-5, WALL_HEIGHT / 2, 0, 0.5, WALL_HEIGHT, 10);
// Right Wall
createWall(5, WALL_HEIGHT / 2, 0, 0.5, WALL_HEIGHT, 10);

// --- LAB CONTENT ---
import {
    createLabTable,
    createFumeHood,
    createBeaker,
    createMicroscope,
    createBunsenBurner
} from './lab_prefabs.js';

// 1. Main Workbench (Center)
const centerTable = createLabTable(2.5, 1.2);
centerTable.position.set(0, 0, 0);
roomGroup.add(centerTable);

// 2. Side Tables (Walls)
const leftTable = createLabTable(0.8, 4);
leftTable.position.set(-4.5, 0, 0);
roomGroup.add(leftTable);

const rightTable = createLabTable(0.8, 4);
rightTable.position.set(4.5, 0, 0);
roomGroup.add(rightTable);

// 3. Fume Hood (Back Wall)
const fumeHood = createFumeHood();
fumeHood.position.set(0, 0, -4.5);
roomGroup.add(fumeHood);

// 4. Equipment & Items

// Microscope on right table
const microscope = createMicroscope();
microscope.position.set(4.5, 0.95, 0);
microscope.rotation.y = -Math.PI / 2;
microscope.name = "microscope";
roomGroup.add(microscope);
interactables.push(microscope);

// Bunsen Burner on center table
const burner = createBunsenBurner();
burner.position.set(-0.5, 0.9, 0.2);
burner.name = "bunsen_burner";
roomGroup.add(burner);
interactables.push(burner);

// Chemicals (Interactables)
const chemicalRed = createBeaker('red');
chemicalRed.position.set(4.5, 0.9, 1);
chemicalRed.name = "chemical_red";
roomGroup.add(chemicalRed);
interactables.push(chemicalRed);

const chemicalBlue = createBeaker('blue');
chemicalBlue.position.set(-4.5, 0.9, -1);
chemicalBlue.name = "chemical_blue";
roomGroup.add(chemicalBlue);
interactables.push(chemicalBlue);

const chemicalGreen = createBeaker('green');
chemicalGreen.position.set(0, 1.15, -4.5); // Inside fume hood
chemicalGreen.name = "chemical_green";
roomGroup.add(chemicalGreen);
interactables.push(chemicalGreen);

// Empty Beaker for mixing
const emptyBeaker = createBeaker('clear'); // We need to handle 'clear' in prefab or just use default
emptyBeaker.position.set(0.5, 0.9, 0);
emptyBeaker.name = "beaker_empty";
roomGroup.add(emptyBeaker);
interactables.push(emptyBeaker);


// --- CONTROLS & INTERACTION ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0);
const mouseDelta = new THREE.Vector2();
let lastMousePos = new THREE.Vector2();
let isMouseDown = false;

// UI
const instructions = document.getElementById('instructions');
const crosshair = document.getElementById('crosshair');

if (instructions) {
    const dismissInstructions = () => {
        instructions.style.display = 'none';
        // Initialize Inventory UI when game starts
        if (typeof initInventoryUI === 'function') initInventoryUI();
    };
    instructions.addEventListener('click', dismissInstructions);
}

function moveForward(distance) {
    _vector.setFromMatrixColumn(camera.matrix, 0);
    _vector.crossVectors(camera.up, _vector);
    camera.position.addScaledVector(_vector, distance);
}

function moveRight(distance) {
    _vector.setFromMatrixColumn(camera.matrix, 0);
    camera.position.addScaledVector(_vector, distance);
}

// Keys
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
};

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// Mouse Look
document.addEventListener('mousedown', () => { isMouseDown = true; });
document.addEventListener('mouseup', () => { isMouseDown = false; });
document.addEventListener('mousemove', (event) => {
    if (isInteracting) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (isMouseDown) {
        const deltaX = event.clientX - lastMousePos.x;
        const deltaY = event.clientY - lastMousePos.y;
        mouseDelta.x += deltaX;
        mouseDelta.y += deltaY;
    }
    lastMousePos.set(event.clientX, event.clientY);

    if (crosshair) {
        crosshair.style.left = event.clientX + 'px';
        crosshair.style.top = event.clientY + 'px';
    }
});

document.addEventListener('click', () => {
    if (isInteracting) return;
    interact();
});

// --- GAME STATE ---
const labState = {
    hasMixedRed: false,
    hasMixedBlue: false,
    hasMixedGreen: false,
    burnerOn: false,
    experimentComplete: false
};

function interact() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactables, true); // Recursive for groups
    if (intersects.length > 0) {
        // Find the root object (the group added to interactables)
        let obj = intersects[0].object;
        while (obj.parent && !interactables.includes(obj)) {
            obj = obj.parent;
        }
        if (!interactables.includes(obj)) return;

        console.log("Clicked:", obj.name);

        // --- CHEMICAL PICKUP ---
        if (obj.name.startsWith("chemical_")) {
            const color = obj.name.split('_')[1];
            const success = addItem({
                id: obj.name,
                name: color.charAt(0).toUpperCase() + color.slice(1) + " Chemical",
                icon: "🧪",
                description: `A flask containing ${color} liquid.`
            });
            if (success) {
                scene.remove(obj);
                const idx = interactables.indexOf(obj);
                if (idx > -1) interactables.splice(idx, 1);
            }
            return;
        }

        // --- BUNSEN BURNER ---
        if (obj.name === "bunsen_burner") {
            labState.burnerOn = !labState.burnerOn;
            const flame = obj.getObjectByName("flame");
            if (flame) flame.visible = labState.burnerOn;
            return;
        }

        // --- EMPTY BEAKER (MIXING STATION) ---
        if (obj.name === "beaker_empty") {
            // Check selected inventory item
            import('./inventory.js').then(({ getSelectedItem, removeItem }) => {
                const item = getSelectedItem();
                if (!item) {
                    alert("You need to select a chemical to pour.");
                    return;
                }

                if (item.id === "chemical_red" && !labState.hasMixedRed) {
                    labState.hasMixedRed = true;
                    removeItem(item.index);
                    alert("Poured Red Chemical.");
                } else if (item.id === "chemical_blue" && !labState.hasMixedBlue) {
                    labState.hasMixedBlue = true;
                    alert("Poured Blue Chemical.");
                } else if (item.id === "chemical_green" && !labState.hasMixedGreen) {
                    labState.hasMixedGreen = true;
                    alert("Poured Green Chemical.");
                }

                // Check for reaction
                if (labState.hasMixedRed && labState.hasMixedBlue && labState.hasMixedGreen && labState.burnerOn) {
                    labState.experimentComplete = true;
                    document.getElementById('victoryModal').style.display = 'flex';
                    document.getElementById('victoryTime').textContent = "SUCCESS";
                }
            });
        }
    }
}

// --- ANIMATION LOOP ---
let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;
    prevTime = time;

    if (!isInteracting && instructions.style.display === 'none') {
        // Camera Look
        _euler.setFromQuaternion(camera.quaternion);
        if (isMouseDown) {
            _euler.y -= mouseDelta.x * MOUSE_LOOK_SPEED;
            _euler.x -= mouseDelta.y * MOUSE_LOOK_SPEED;
        }
        mouseDelta.set(0, 0);

        _euler.x = Math.max(_PI_2 - MAX_POLAR_ANGLE, Math.min(_PI_2 - MIN_POLAR_ANGLE, _euler.x));
        camera.quaternion.setFromEuler(_euler);

        // Movement
        const actualSpeed = MOVE_SPEED * delta;
        if (keys.w || keys.ArrowUp) moveForward(actualSpeed);
        if (keys.s || keys.ArrowDown) moveForward(-actualSpeed);
        if (keys.a || keys.ArrowLeft) moveRight(-actualSpeed);
        if (keys.d || keys.ArrowRight) moveRight(actualSpeed);
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

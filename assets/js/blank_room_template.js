// This file serves as a blank template for creating new escape room scenes.
// To use this template, developers should:
// 1. Duplicate this file and its corresponding HTML file (`blank_room_template.html`).
// 2. Rename the files to match the new scene's name.
// 3. Update the HTML file to reference the new JavaScript file.
// 4. Customize the scene by adding models, interactable objects, and game logic.
//    - Import necessary modules like `gameLogic.js`, `ui.js`, etc.
//    - Add 3D models using `loadModel` from `modelLoader.js`.
//    - Populate the `interactables` array with objects that the player can click on.
// 5. Adjust lighting, camera position, and room geometry as needed.

console.log("blank_room_template.js loaded");
import * as THREE from 'three';
import { loadModel } from './modelLoader.js';
import {
    TEMPLATE_TILE_SCALE,
    TEMPLATE_ROOM_SIZE,
    TEMPLATE_WALL_SIZE,
    TEMPLATE_START_POSITION,
    TEMPLATE_BACKGROUND_COLOR,
    FOG_COLOR,
    FOG_NEAR,
    FOG_FAR,
    CAMERA_FOV,
    CAMERA_NEAR,
    CAMERA_FAR,
    CAMERA_HEIGHT,
    DEFAULT_TIMER_DURATION
} from './constants.js';

// --- CONSTANTS ---
const interactables = [];
let gameWon = false; // This would be controlled by game logic
const tileScale = TEMPLATE_TILE_SCALE;
const roomSize = TEMPLATE_ROOM_SIZE;
const wallSize = TEMPLATE_WALL_SIZE;
const start = TEMPLATE_START_POSITION;

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(TEMPLATE_BACKGROUND_COLOR);
scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

const camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, CAMERA_NEAR, CAMERA_FAR);
camera.position.set(0, CAMERA_HEIGHT, 5);

// --- LIGHTING ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(-10, 10, -10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// --- ROOM ---
const roomGroup = new THREE.Group();
scene.add(roomGroup);

// Floor
for (let x = 0; x < roomSize; x++) {
    for (let z = 0; z < roomSize; z++) {
        const px = start + x * wallSize;
        const pz = start + z * wallSize;
        loadModel('assets/models/floorFull.glb', {
            pos: [px, 0, pz],
            scale: [tileScale, tileScale, tileScale],
            parent: roomGroup
        });
    }
}

// Ceiling
const ceilingGeometry = new THREE.PlaneGeometry(10, 10);
const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = 3;
roomGroup.add(ceiling);

// Walls
for (let i = 0; i < roomSize; i++) {
    const p = start + i * wallSize;

    // Back Wall (Z=-5)
    loadModel('assets/models/wall.glb', { pos: [p, 0, -5], scale: [tileScale, tileScale, tileScale], parent: roomGroup });

    // Front Wall (Z=5)
    loadModel('assets/models/wall.glb', { pos: [p, 0, 5], rot: [0, Math.PI, 0], scale: [tileScale, tileScale, tileScale], parent: roomGroup });

    // Left Wall (X=-5)
    loadModel('assets/models/wall.glb', { pos: [-5, 0, p], rot: [0, Math.PI / 2, 0], scale: [tileScale, tileScale, tileScale], parent: roomGroup });

    // Right Wall (X=5) - with doorway at the second segment (i=1)
    if (i === 1) {
        loadModel('assets/models/wallDoorway.glb', { pos: [5, 0, p], rot: [0, -Math.PI / 2, 0], scale: [tileScale, tileScale, tileScale], parent: roomGroup });
    } else {
        loadModel('assets/models/wall.glb', { pos: [5, 0, p], rot: [0, -Math.PI / 2, 0], scale: [tileScale, tileScale, tileScale], parent: roomGroup });
    }
}


// --- DOOR & TIMER ---
const doorGroup = new THREE.Group();
doorGroup.position.set(5, 0, start + 1 * wallSize); // Position at the doorway
doorGroup.rotation.y = -Math.PI / 2;
scene.add(doorGroup);

// Door Pivot Group for hinging
const doorPivot = new THREE.Group();
doorPivot.position.set(-0.75, 1.1, 0.02);
doorGroup.add(doorPivot);

// Load Door Model
loadModel('assets/models/doorway.glb', {
    pos: [0.75, 0, 0],
    rot: [0, 0, 0],
    scale: [2.5, 2.5, 2.5],
    parent: doorPivot
}).then(model => {
    // Add a simple handle to the door
    const handleGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 1.0, roughness: 0.5 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0.5, 1.1, 0.1); // Position relative to the door model
    model.add(handle);
});

// Add a hitbox for interaction
const doorHitbox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 0.2), new THREE.MeshBasicMaterial({ visible: false }));
doorHitbox.name = "door";
doorHitbox.position.set(0.75, 1.1, 0);
doorPivot.add(doorHitbox);
interactables.push(doorHitbox);

// Timer
const timerGroup = new THREE.Group();
timerGroup.position.set(0, 2.6, 0.1);
doorGroup.add(timerGroup);
const timerBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 }));
timerGroup.add(timerBox);

const timerCanvas = document.createElement('canvas');
timerCanvas.width = 512;
timerCanvas.height = 256;
const tCtx = timerCanvas.getContext('2d');
const timerTexture = new THREE.CanvasTexture(timerCanvas);
const displayMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ map: timerTexture }));
displayMesh.position.z = 0.051; // Slightly in front of the box
timerGroup.add(displayMesh);

let timeLeft = DEFAULT_TIMER_DURATION;
let finalTimeStr = "00:00";

function updateTimer(dt) {
    if (!gameWon) timeLeft = Math.max(0, timeLeft - dt);
    const m = Math.floor(timeLeft / 60);
    const s = Math.floor(timeLeft % 60);
    finalTimeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    const timeStr = finalTimeStr;

    tCtx.fillStyle = '#050505';
    tCtx.fillRect(0, 0, 512, 256);
    tCtx.shadowColor = "#ff0000";
    tCtx.shadowBlur = 30;
    tCtx.fillStyle = '#ff3333';
    tCtx.font = 'bold 140px "Share Tech Mono", monospace';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.fillText(timeStr, 256, 128);

    // --- Border effect ---
    tCtx.save();
    tCtx.shadowColor = "rgba(0,0,0,0.7)";
    tCtx.shadowBlur = 8;
    tCtx.lineWidth = 8;
    tCtx.strokeStyle = "#ff3333";
    tCtx.strokeRect(8, 8, 496, 240);
    tCtx.restore();

    // --- Scanline effect ---
    tCtx.save();
    tCtx.globalAlpha = 0.12;
    tCtx.fillStyle = "#fff";
    for (let y = 0; y < 256; y += 4) {
        tCtx.fillRect(0, y, 512, 2);
    }
    tCtx.restore();
    timerTexture.needsUpdate = true;
}


// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- ANIMATION LOOP ---
let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;
    prevTime = time;

    updateTimer(delta);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Expose for verification
window.camera = camera;
window.scene = scene;
window.renderer = renderer;
window.interactables = interactables;

animate();

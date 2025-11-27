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
    TILE_SCALE,
    ROOM_SIZE,
    WALL_SIZE,
    ROOM_START_COORDINATE,
    TIMER_DURATION,
    LOOK_SPEED,
    MOVE_SPEED,
    MOUSE_LOOK_SPEED,
    MIN_POLAR_ANGLE,
    MAX_POLAR_ANGLE,
    INITIAL_ROOM_BOUNDS,
    SCENE_BACKGROUND_COLOR,
    FOG_COLOR,
    FOG_NEAR,
    FOG_FAR
} from './constants.js';
import { TouchControls } from './touchControls.js';
import { showModal, closeModal, isInteracting } from './ui.js';
import { createTouchInteractionHandler } from './touchUtils.js';

// --- CONSTANTS ---
const interactables = [];
let gameWon = false; // This would be controlled by game logic
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _PI_2 = Math.PI / 2;
const _vector = new THREE.Vector3();

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);
scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

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
for (let x = 0; x < ROOM_SIZE; x++) {
    for (let z = 0; z < ROOM_SIZE; z++) {
        const px = ROOM_START_COORDINATE + x * WALL_SIZE;
        const pz = ROOM_START_COORDINATE + z * WALL_SIZE;
        loadModel('assets/models/floorFull.glb', {
            pos: [px, 0, pz],
            scale: [TILE_SCALE, TILE_SCALE, TILE_SCALE],
            parent: roomGroup
        });
    }
}

// Ceiling
const roomWidth = ROOM_SIZE * WALL_SIZE;
const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomWidth);
const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = 3;
roomGroup.add(ceiling);

// Walls
// Corners (placed outside the main loop logic for simplicity)
const cornerOffset = (roomWidth / 2); // 5.0
const cornerModel = 'assets/models/wallCorner.glb';
loadModel(cornerModel, { pos: [-cornerOffset, 0, -cornerOffset], rot: [0, 0, 0], scale: [TILE_SCALE, TILE_SCALE, TILE_SCALE], parent: roomGroup });
loadModel(cornerModel, { pos: [cornerOffset, 0, -cornerOffset], rot: [0, -Math.PI / 2, 0], scale: [TILE_SCALE, TILE_SCALE, TILE_SCALE], parent: roomGroup });
loadModel(cornerModel, { pos: [-cornerOffset, 0, cornerOffset], rot: [0, Math.PI / 2, 0], scale: [TILE_SCALE, TILE_SCALE, TILE_SCALE], parent: roomGroup });
loadModel(cornerModel, { pos: [cornerOffset, 0, cornerOffset], rot: [0, Math.PI, 0], scale: [TILE_SCALE, TILE_SCALE, TILE_SCALE], parent: roomGroup });

for (let i = 0; i < ROOM_SIZE; i++) {
    const p = ROOM_START_COORDINATE + i * WALL_SIZE;

    // Back Wall (Z=-5)
    loadModel('assets/models/wall.glb', { pos: [p, 0, -5], scale: [TILE_SCALE, TILE_SCALE, TILE_SCALE], parent: roomGroup });

    // Front Wall (Z=5)
    loadModel('assets/models/wall.glb', { pos: [p, 0, 5], rot: [0, Math.PI, 0], scale: [TILE_SCALE, TILE_SCALE, TILE_SCALE], parent: roomGroup });

    // Left Wall (X=-5)
    loadModel('assets/models/wall.glb', { pos: [-5, 0, p], rot: [0, Math.PI / 2, 0], scale: [TILE_SCALE, TILE_SCALE, TILE_SCALE], parent: roomGroup });

    // Right Wall (X=5) - with doorway at index 5 (near center)
    if (i === 5) {
        loadModel('assets/models/wallDoorway.glb', { pos: [5, 0, p], rot: [0, -Math.PI / 2, 0], scale: [TILE_SCALE, TILE_SCALE, TILE_SCALE], parent: roomGroup });
    } else {
        loadModel('assets/models/wall.glb', { pos: [5, 0, p], rot: [0, -Math.PI / 2, 0], scale: [TILE_SCALE, TILE_SCALE, TILE_SCALE], parent: roomGroup });
    }
}


// --- DOOR & TIMER ---
const doorZ = ROOM_START_COORDINATE + 5 * WALL_SIZE;
const doorGroup = new THREE.Group();
doorGroup.position.set(5, 0, doorZ);
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
    scale: [TILE_SCALE, TILE_SCALE, TILE_SCALE], // Match room scale
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

let timeLeft = TIMER_DURATION;
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

// --- CONTROLS & INTERACTION ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0);
const mouseDelta = new THREE.Vector2();
let lastMousePos = new THREE.Vector2();
let isMouseDown = false;
let roomBounds = { minX: -INITIAL_ROOM_BOUNDS, maxX: INITIAL_ROOM_BOUNDS, minZ: -INITIAL_ROOM_BOUNDS, maxZ: INITIAL_ROOM_BOUNDS };

// UI Elements
const instructions = document.getElementById('instructions');
const crosshair = document.getElementById('crosshair');

// Instructions Handling
if (instructions) {
    instructions.addEventListener('click', () => {
        instructions.style.display = 'none';
    });
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

// Touch Controls
const handleTouchInteract = createTouchInteractionHandler({
    showModal,
    isInteracting: () => isInteracting,
    getContext: () => ({ doorPivot, finalTimeStr })
});

const touchControls = new TouchControls(camera, raycaster, interactables, handleTouchInteract);

// Input Handling
const keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, a: false, s: false, d: false,
    KeyW: false, KeyA: false, KeyS: false, KeyD: false,
    Space: false
};

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) {
        keys[e.key] = true;
        keys[e.code] = true;
    }
    if ((e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        if (isInteracting) {
            closeModal();
        } else {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactables, false);
            if (intersects.length > 0) {
                showModal(intersects[0].object.name, { doorPivot, finalTimeStr });
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) {
        keys[e.key] = false;
        keys[e.code] = false;
    }
});

// Mouse Interaction
document.addEventListener('mousedown', () => { isMouseDown = true; });
document.addEventListener('mouseup', () => { isMouseDown = false; });
document.addEventListener('mousemove', (event) => {
    const currentlyInteracting = isInteracting;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (isMouseDown && !currentlyInteracting) {
        const deltaX = event.clientX - lastMousePos.x;
        const deltaY = event.clientY - lastMousePos.y;
        mouseDelta.x += deltaX;
        mouseDelta.y += deltaY;
    }
    lastMousePos.set(event.clientX, event.clientY);

    if (!currentlyInteracting && crosshair) {
        crosshair.style.left = event.clientX + 'px';
        crosshair.style.top = event.clientY + 'px';
    }
});

document.addEventListener('click', () => {
    if (isInteracting) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactables, false);
    if (intersects.length > 0) {
        showModal(intersects[0].object.name, { doorPivot, finalTimeStr });
    }
});

function setGameCursor(active) {
    if (active) {
        document.body.classList.add('game-active');
    } else {
        document.body.classList.remove('game-active');
    }
}

// --- ANIMATION LOOP ---
let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;
    prevTime = time;

    updateTimer(delta);

    // Cursor State
    if (!isInteracting && instructions && instructions.style.display === 'none') {
        setGameCursor(true);
    } else {
        setGameCursor(false);
    }

    if (!isInteracting) {
        // Crosshair
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactables, false);
        if (crosshair) {
            if (intersects.length > 0) {
                crosshair.classList.add('active');
            } else {
                crosshair.classList.remove('active');
            }
        }

        // Look
        _euler.setFromQuaternion(camera.quaternion);
        if (isMouseDown) {
            _euler.y -= mouseDelta.x * MOUSE_LOOK_SPEED;
            _euler.x -= mouseDelta.y * MOUSE_LOOK_SPEED;
        }
        mouseDelta.set(0, 0);

        if (keys.ArrowLeft) _euler.y += LOOK_SPEED * delta;
        if (keys.ArrowRight) _euler.y -= LOOK_SPEED * delta;
        if (keys.ArrowUp) _euler.x += LOOK_SPEED * delta;
        if (keys.ArrowDown) _euler.x -= LOOK_SPEED * delta;

        // Touch look
        if (touchControls) {
            const lookDelta = touchControls.getLookDelta();
            _euler.y -= lookDelta.x * 2;
            _euler.x -= lookDelta.y * 2;
        }

        _euler.x = Math.max(_PI_2 - MAX_POLAR_ANGLE, Math.min(_PI_2 - MIN_POLAR_ANGLE, _euler.x));
        camera.quaternion.setFromEuler(_euler);

        // Move
        const actualSpeed = MOVE_SPEED * delta;
        if (keys.w || keys.KeyW) moveForward(actualSpeed);
        if (keys.s || keys.KeyS) moveForward(-actualSpeed);
        if (keys.a || keys.KeyA) moveRight(-actualSpeed);
        if (keys.d || keys.KeyD) moveRight(actualSpeed);

        if (touchControls) {
            const moveState = touchControls.getMovement();
            if (moveState.forward) moveForward(actualSpeed);
            if (moveState.backward) moveForward(-actualSpeed);
            if (moveState.left) moveRight(-actualSpeed);
            if (moveState.right) moveRight(actualSpeed);
        }

        // Bounds
        const pos = camera.position;
        pos.x = Math.max(roomBounds.minX, Math.min(roomBounds.maxX, pos.x));
        pos.z = Math.max(roomBounds.minZ, Math.min(roomBounds.maxZ, pos.z));
    }

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

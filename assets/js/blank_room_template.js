// This file serves as a blank template for creating new escape room scenes.
// It uses procedural geometry (Three.js primitives) instead of loading external GLB assets for the room structure.
// To use this template:
// 1. Duplicate this file and `blank_room_template.html`.
// 2. Rename them to your new scene name.
// 3. Customize the room layout, interactables, and logic below.

console.log("blank_room_template.js (Procedural) loaded");
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
let gameWon = false;
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _PI_2 = Math.PI / 2;
const _vector = new THREE.Vector3();

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);
scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, CAMERA_HEIGHT, 0); // Start in center

// --- LIGHTING ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(-5, 10, -5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// Point light near the door to highlight it
const doorLight = new THREE.PointLight(0xffaa00, 0.5, 10);
doorLight.position.set(3, 2, 0.5);
scene.add(doorLight);

// --- PROCEDURAL ROOM GENERATION ---
const roomGroup = new THREE.Group();
scene.add(roomGroup);

// Materials
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.9 });
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 }); // SaddleBrown
const handleMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 }); // Gold
const lockMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.5 });

// Dimensions
const roomWidth = 10; // 10x10 room
const wallThickness = 1.0;
const halfWidth = roomWidth / 2; // 5
const wallOffset = halfWidth - (wallThickness / 2); // 4.5

// Floor
const floorGeo = new THREE.PlaneGeometry(roomWidth, roomWidth);
const floor = new THREE.Mesh(floorGeo, floorMaterial);
floor.rotation.x = -Math.PI / 2;
roomGroup.add(floor);

// Ceiling
const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomWidth);
const ceiling = new THREE.Mesh(ceilingGeo, ceilingMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = WALL_HEIGHT;
roomGroup.add(ceiling);

// Walls
// Corners (placed outside the main loop logic for simplicity)
const cornerOffset = (roomWidth / 2) - 0.5; // Offset corners inward by half a tile to align with wall segments
const cornerModel = 'assets/models/wallCorner.glb';

// Top-Left Corner
loadModel(cornerModel, { pos: [-cornerOffset, 0, -cornerOffset], rot: [0, 0, 0], scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE], parent: roomGroup });
loadModel(cornerModel, { pos: [-cornerOffset, 0, -cornerOffset], rot: [0, -Math.PI / 2, 0], scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE], parent: roomGroup });

// Top-Right Corner
loadModel(cornerModel, { pos: [cornerOffset, 0, -cornerOffset], rot: [0, -Math.PI / 2, 0], scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE], parent: roomGroup });
loadModel(cornerModel, { pos: [cornerOffset, 0, -cornerOffset], rot: [0, Math.PI, 0], scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE], parent: roomGroup });

// Bottom-Left Corner
loadModel(cornerModel, { pos: [-cornerOffset, 0, cornerOffset], rot: [0, Math.PI / 2, 0], scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE], parent: roomGroup });
loadModel(cornerModel, { pos: [-cornerOffset, 0, cornerOffset], rot: [0, 0, 0], scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE], parent: roomGroup });

// Bottom-Right Corner
loadModel(cornerModel, { pos: [cornerOffset, 0, cornerOffset], rot: [0, Math.PI, 0], scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE], parent: roomGroup });
loadModel(cornerModel, { pos: [cornerOffset, 0, cornerOffset], rot: [0, Math.PI / 2, 0], scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE], parent: roomGroup });

// Skip first and last segments as corners occupy those positions
for (let i = 1; i < ROOM_SIZE - 1; i++) {
    const p = ROOM_START_COORDINATE + i * WALL_SIZE;

    // Back Wall (Z=-cornerOffset)
    loadModel('assets/models/wall.glb', { pos: [p, 0, -cornerOffset], scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE], parent: roomGroup });

    // Front Wall (Z=cornerOffset)
    loadModel('assets/models/wall.glb', { pos: [p, 0, cornerOffset], rot: [0, Math.PI, 0], scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE], parent: roomGroup });

    // Left Wall (X=-cornerOffset)
    loadModel('assets/models/wall.glb', { pos: [-cornerOffset, 0, p], rot: [0, Math.PI / 2, 0], scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE], parent: roomGroup });

    // Right Wall (X=cornerOffset) - with doorway at index 5 (near center)
    if (i === 5) {
        loadModel('assets/models/wallDoorway.glb', { pos: [cornerOffset, 0, p], rot: [0, -Math.PI / 2, 0], scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE], parent: roomGroup });
    } else {
        loadModel('assets/models/wall.glb', { pos: [cornerOffset, 0, p], rot: [0, -Math.PI / 2, 0], scale: [TILE_SCALE, WALL_HEIGHT, TILE_SCALE], parent: roomGroup });
    }
}


// --- DOOR & TIMER ---
const doorZ = ROOM_START_COORDINATE + 5 * WALL_SIZE;
const doorGroup = new THREE.Group();
doorGroup.position.set(cornerOffset, 0, doorZ);
doorGroup.rotation.y = -Math.PI / 2;
scene.add(doorGroup);

// Door Pivot Group for hinging
const doorPivot = new THREE.Group();
// Pivot at the hinge: Inner corner of the doorway
// X = 4.5 - 0.5 = 4.0 (Inner face)
// Z = 0.0 (Start of door hole)
doorPivot.position.set(wallOffset - wallThickness / 2, 0, doorZStart);
roomGroup.add(doorPivot);

// The Door Mesh
const doorThickness = 0.1;
const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorThickness, doorHeight, doorWidth), doorMaterial);
// Position relative to pivot: Shifted so hinge is at edge
// Center X = 0 (flush with pivot X) ?? No, if pivot is at corner, door should swing in.
// Let's place the door center at (0, height/2, width/2) so it swings into the room.
// But we want it to align with the wall hole when closed.
// If closed, it sits at Z [0, 1]. Width is along Z.
// So center Z is 0.5.
// Center X should be 0 (if flush with wall inner face).
doorMesh.position.set(0, doorHeight / 2, doorWidth / 2);
doorPivot.add(doorMesh);

// Door Handle
const handle = new THREE.Mesh(new THREE.SphereGeometry(0.06), handleMaterial);
handle.position.set(-0.1, -0.1, 0.35); // Sticking out into room, near edge (Z=0.35 is inside [-0.5, 0.5])
doorMesh.add(handle);

// Skeleton Key Lock
const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.1), lockMaterial);
lockPlate.position.set(-0.06, -0.25, 0.35); // Just below handle
doorMesh.add(lockPlate);

const keyHole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.03, 8), new THREE.MeshBasicMaterial({ color: 0x000000 }));
keyHole.rotation.z = Math.PI / 2;
keyHole.position.set(-0.08, -0.25, 0.35);
doorMesh.add(keyHole);

// Door Hitbox (for interaction)
const doorHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 1), new THREE.MeshBasicMaterial({ visible: false }));
doorHitbox.name = "locked_door";
doorHitbox.position.set(0, 1, 0.5);
doorPivot.add(doorHitbox);
interactables.push(doorHitbox);


// --- TIMER ---
// Mounted on the wall above the door
const timerGroup = new THREE.Group();
// Position on the lintel inner face
timerGroup.position.set(wallOffset - wallThickness / 2 - 0.02, 2.5, 0.5);
timerGroup.rotation.y = -Math.PI / 2; // Face into the room (-X direction)
roomGroup.add(timerGroup);

const timerBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.05), new THREE.MeshStandardMaterial({ color: 0x111111 }));
timerGroup.add(timerBox);

const timerCanvas = document.createElement('canvas');
timerCanvas.width = 512;
timerCanvas.height = 256;
const tCtx = timerCanvas.getContext('2d');
const timerTexture = new THREE.CanvasTexture(timerCanvas);
const displayMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.25), new THREE.MeshBasicMaterial({ map: timerTexture }));
displayMesh.position.z = 0.03; // Slightly in front of the box
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

    // Glow effect
    tCtx.shadowColor = "#ff0000";
    tCtx.shadowBlur = 30;
    tCtx.fillStyle = '#ff3333';
    tCtx.font = 'bold 140px "Share Tech Mono", monospace';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.fillText(timeStr, 256, 128);

    // Border
    tCtx.save();
    tCtx.shadowColor = "rgba(0,0,0,0.7)";
    tCtx.shadowBlur = 8;
    tCtx.lineWidth = 10;
    tCtx.strokeStyle = "#aa0000";
    tCtx.strokeRect(10, 10, 492, 236);
    tCtx.restore();

    // Scanlines
    tCtx.save();
    tCtx.globalAlpha = 0.15;
    tCtx.fillStyle = "#ffffff";
    for (let y = 0; y < 256; y += 6) {
        tCtx.fillRect(0, y, 512, 2);
    }
    tCtx.restore();

    timerTexture.needsUpdate = true;
}


// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- CONTROLS & INTERACTION ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0);
const mouseDelta = new THREE.Vector2();
let lastMousePos = new THREE.Vector2();
let isMouseDown = false;

// Calculate valid movement bounds based on room size and wall thickness
// Room width is 10, centered at 0. Inner wall faces are at +/- 4.0 (since walls are 1.0 thick at +/- 4.5 center)
// Player collision radius approximation (keep them slightly away from wall)
const BOUND_OFFSET = 0.2;
const validBound = (roomWidth / 2) - wallThickness - BOUND_OFFSET;
let roomBounds = {
    minX: -validBound,
    maxX: validBound,
    minZ: -validBound,
    maxZ: validBound
};

// UI Elements
const instructions = document.getElementById('instructions');
const crosshair = document.getElementById('crosshair');

// Instructions Handling
if (instructions) {
    instructions.addEventListener('click', () => {
        instructions.style.display = 'none';
        // Request pointer lock for better experience if desired, but click-drag is standard here
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
        // Crosshair check
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

        // Collision / Bounds
        const pos = camera.position;
        // Simple rectangular bounds
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

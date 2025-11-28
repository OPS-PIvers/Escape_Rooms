// This file is a completely procedural blank room template.
// It uses NO external GLB assets. Everything is generated using Three.js primitives.

console.log("blank_room_template.js (Procedural Rebuild) loaded");
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
import { showModal, closeModal, isInteracting } from './ui.js';
import { createTouchInteractionHandler } from './touchUtils.js';

// --- CONSTANTS ---
const interactables = [];
let gameWon = false;
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _PI_2 = Math.PI / 2;
const _vector = new THREE.Vector3();

// Room Config
const TEMPLATE_ROOM_WIDTH = 10;
const TEMPLATE_WALL_THICKNESS = 0.5;
const WALL_COLOR = 0xeeeeee;
const FLOOR_COLOR = 0x444444;
const CEILING_COLOR = 0xcccccc;

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
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// Point light near the door to highlight it
const doorLight = new THREE.PointLight(0xffaa00, 0.5, 10);
// We will position this after we know where the door is (it will be on the North wall, Z = -5 approx)
// Actually, let's put the door on the 'Front' (Z = positive) or 'Back' (Z = negative).
// Let's stick to standard: Door on North Wall (Negative Z) or South Wall (Positive Z).
// The previous template had walls at +/- 4.5.
// Let's put the door on the North Wall (Negative Z).
doorLight.position.set(0, 2, -4);
scene.add(doorLight);


// --- PROCEDURAL GENERATION ---
const roomGroup = new THREE.Group();
scene.add(roomGroup);

// Materials
const wallMat = new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.9 });
const floorMat = new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.8 });
const ceilingMat = new THREE.MeshStandardMaterial({ color: CEILING_COLOR, roughness: 0.9 });
const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 }); // SaddleBrown
const frameMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.8 });
const handleMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.8, roughness: 0.2 }); // Silver
const timerBoxMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

function createRoom() {
    const halfSize = TEMPLATE_ROOM_WIDTH / 2;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(TEMPLATE_ROOM_WIDTH, TEMPLATE_ROOM_WIDTH);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(TEMPLATE_ROOM_WIDTH, TEMPLATE_ROOM_WIDTH);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_HEIGHT;
    roomGroup.add(ceiling);

    // Walls
    // We need 4 walls. One will have a door hole.
    // Let's place the door on the North Wall (Z = -halfSize).

    // South Wall (Z = +halfSize) - Solid
    const southWall = new THREE.Mesh(
        new THREE.BoxGeometry(TEMPLATE_ROOM_WIDTH, WALL_HEIGHT, TEMPLATE_WALL_THICKNESS),
        wallMat
    );
    southWall.position.set(0, WALL_HEIGHT / 2, halfSize);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    roomGroup.add(southWall);

    // East Wall (X = +halfSize) - Solid
    const eastWall = new THREE.Mesh(
        new THREE.BoxGeometry(TEMPLATE_WALL_THICKNESS, WALL_HEIGHT, TEMPLATE_ROOM_WIDTH),
        wallMat
    );
    eastWall.position.set(halfSize, WALL_HEIGHT / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    roomGroup.add(eastWall);

    // West Wall (X = -halfSize) - Solid
    const westWall = new THREE.Mesh(
        new THREE.BoxGeometry(TEMPLATE_WALL_THICKNESS, WALL_HEIGHT, TEMPLATE_ROOM_WIDTH),
        wallMat
    );
    westWall.position.set(-halfSize, WALL_HEIGHT / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    roomGroup.add(westWall);

    // North Wall (Z = -halfSize) - With Door Hole
    // Door Dimensions
    const doorW = 1.2;
    const doorH = 2.2;

    // We construct the wall from 3 parts: Left of door, Right of door, Above door (Lintel).
    // Wall is centered at Z = -halfSize.
    // X goes from -halfSize to +halfSize.
    // Door center X = 0.

    // Left Part (X: -halfSize to -doorW/2)
    const sidePartWidth = (TEMPLATE_ROOM_WIDTH - doorW) / 2;
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(sidePartWidth, WALL_HEIGHT, TEMPLATE_WALL_THICKNESS),
        wallMat
    );
    leftWall.position.set(-(doorW/2 + sidePartWidth/2), WALL_HEIGHT/2, -halfSize);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    // Right Part (X: +doorW/2 to +halfSize)
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(sidePartWidth, WALL_HEIGHT, TEMPLATE_WALL_THICKNESS),
        wallMat
    );
    rightWall.position.set((doorW/2 + sidePartWidth/2), WALL_HEIGHT/2, -halfSize);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    roomGroup.add(rightWall);

    // Lintel (X: -doorW/2 to +doorW/2, Y: doorH to WALL_HEIGHT)
    const lintelHeight = WALL_HEIGHT - doorH;
    const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(doorW, lintelHeight, TEMPLATE_WALL_THICKNESS),
        wallMat
    );
    lintel.position.set(0, doorH + lintelHeight/2, -halfSize);
    lintel.castShadow = true;
    lintel.receiveShadow = true;
    roomGroup.add(lintel);

    return { doorW, doorH, wallZ: -halfSize };
}

const roomInfo = createRoom();

// --- DOOR & HANDLE ---
const doorGroup = new THREE.Group();
scene.add(doorGroup);

const doorPivot = new THREE.Group();
// Pivot at the left edge of the door frame (viewed from inside)
// Wall Z is -5. Door W is 1.2.
// Left edge X = -0.6.
// Z position should be aligned with the inner face of the wall (or centered).
// Let's center it in the wall thickness for now.
doorPivot.position.set(-roomInfo.doorW / 2, 0, roomInfo.wallZ);
roomGroup.add(doorPivot);

// Door Mesh
const doorThickness = 0.1;
const doorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(roomInfo.doorW, roomInfo.doorH, doorThickness),
    doorMat
);
// Position relative to pivot.
// Pivot is at Left Edge.
// Center of door mesh should be at X = +width/2.
// Y = height/2.
doorMesh.position.set(roomInfo.doorW / 2, roomInfo.doorH / 2, 0);
doorMesh.castShadow = true;
doorMesh.receiveShadow = true;
doorPivot.add(doorMesh);

// Paddle Handle
function createPaddleHandle() {
    const handleGroup = new THREE.Group();

    // The base plate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.01), handleMat);
    plate.position.set(0, 0, 0);
    handleGroup.add(plate);

    // The axis/stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 8), handleMat);
    stem.rotation.x = Math.PI / 2;
    stem.position.set(0, 0, 0.03);
    handleGroup.add(stem);

    // The Paddle (Lever)
    const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.015), handleMat);
    // Paddle sticks out horizontally
    paddle.position.set(0.04, 0, 0.06);
    handleGroup.add(paddle);

    return handleGroup;
}

const handle = createPaddleHandle();
// Position handle on the door
// Relative to door mesh center (0,0,0)
// Door Width Extent: [-0.6, 0.6] -> Handle on right: ~0.45
// Door Height Extent: [-1.1, 1.1] -> Handle height 1m from floor. Floor is at -1.1 relative to center. So -1.1 + 1.0 = -0.1.
// Z offset to stick out of door: 0.05 (surface) + small gap
handle.position.set((roomInfo.doorW / 2) - 0.15, -0.1, doorThickness/2 + 0.005);
doorMesh.add(handle);

// Invisible Hitbox for Door
const doorHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(roomInfo.doorW, roomInfo.doorH, 0.5),
    new THREE.MeshBasicMaterial({ visible: false })
);
doorHitbox.name = "template_door";
doorHitbox.position.set(roomInfo.doorW/2, roomInfo.doorH/2, 0);
doorPivot.add(doorHitbox);
interactables.push(doorHitbox);


// --- COUNTDOWN TIMER ---
// Placed above the door (on the lintel)
const timerGroup = new THREE.Group();
// Center X = 0.
// Height: Just above the door frame. Door is 2.2. Lintel center is ~2.6.
// Z: Slightly inside the room from the wall surface.
// Wall is at Z = -5. Thickness 0.5. Inner face is -5 + 0.25 = -4.75.
timerGroup.position.set(0, roomInfo.doorH + 0.4, roomInfo.wallZ + TEMPLATE_WALL_THICKNESS/2 + 0.05);
roomGroup.add(timerGroup);

const timerBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.1), timerBoxMat);
timerGroup.add(timerBox);

const timerCanvas = document.createElement('canvas');
timerCanvas.width = 512;
timerCanvas.height = 256;
const tCtx = timerCanvas.getContext('2d');
const timerTexture = new THREE.CanvasTexture(timerCanvas);
const displayMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.25), new THREE.MeshBasicMaterial({ map: timerTexture }));
displayMesh.position.z = 0.051; // Slightly in front of box
timerGroup.add(displayMesh);

let timeLeft = TIMER_DURATION;
let finalTimeStr = "00:00";

function updateTimer(dt) {
    if (!gameWon) timeLeft = Math.max(0, timeLeft - dt);
    const m = Math.floor(timeLeft / 60);
    const s = Math.floor(timeLeft % 60);
    finalTimeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    const timeStr = finalTimeStr;

    tCtx.fillStyle = '#000000';
    tCtx.fillRect(0, 0, 512, 256);

    // Digital Clock Look
    tCtx.shadowColor = "#00ff00";
    tCtx.shadowBlur = 20;
    tCtx.fillStyle = '#00ff00';
    tCtx.font = 'bold 120px "Courier New", monospace';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.fillText(timeStr, 256, 128);

    timerTexture.needsUpdate = true;
}


// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- CONTROLS & INTERACTION ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0);
const mouseDelta = new THREE.Vector2();
let lastMousePos = new THREE.Vector2();
let isMouseDown = false;

// Collision Bounds
const boundSize = (TEMPLATE_ROOM_WIDTH / 2) - 0.5;
const roomBounds = {
    minX: -boundSize,
    maxX: boundSize,
    minZ: -boundSize,
    maxZ: boundSize
};

// UI
const instructions = document.getElementById('instructions');
const crosshair = document.getElementById('crosshair');

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

// Touch
const handleTouchInteract = createTouchInteractionHandler({
    showModal,
    isInteracting: () => isInteracting,
    getContext: () => ({ doorPivot, finalTimeStr })
});
const touchControls = new TouchControls(camera, raycaster, interactables, handleTouchInteract);

// Keys
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
            interact();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) {
        keys[e.key] = false;
        keys[e.code] = false;
    }
});

// Mouse
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
    interact();
});

function interact() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactables, false);
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj.name === "template_door") {
            // Simple interaction: Toggle open/close animation
            // In a real game, this might verify a key
            if (doorPivot.rotation.y === 0) {
                 // Open
                 const targetRot = -Math.PI / 2;
                 const duration = 1000;
                 const start = performance.now();
                 function animateDoor(now) {
                     const p = Math.min(1, (now - start) / duration);
                     // Ease out
                     const ease = 1 - Math.pow(1 - p, 3);
                     doorPivot.rotation.y = targetRot * ease;
                     if (p < 1) requestAnimationFrame(animateDoor);
                 }
                 requestAnimationFrame(animateDoor);
            } else {
                // Close
                const startRot = doorPivot.rotation.y;
                const duration = 1000;
                const start = performance.now();
                function animateDoorClose(now) {
                     const p = Math.min(1, (now - start) / duration);
                     const ease = 1 - Math.pow(1 - p, 3);
                     doorPivot.rotation.y = startRot * (1 - ease);
                     if (p < 1) requestAnimationFrame(animateDoorClose);
                 }
                 requestAnimationFrame(animateDoorClose);
            }
        }
    }
}

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

    if (!isInteracting && instructions && instructions.style.display === 'none') {
        setGameCursor(true);
    } else {
        setGameCursor(false);
    }

    if (!isInteracting) {
        // Crosshair highlight
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactables, false);
        if (crosshair) {
            if (intersects.length > 0) {
                crosshair.classList.add('active');
            } else {
                crosshair.classList.remove('active');
            }
        }

        // Camera Look
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

        if (touchControls) {
            const lookDelta = touchControls.getLookDelta();
            _euler.y -= lookDelta.x * 2;
            _euler.x -= lookDelta.y * 2;
        }

        _euler.x = Math.max(_PI_2 - MAX_POLAR_ANGLE, Math.min(_PI_2 - MIN_POLAR_ANGLE, _euler.x));
        camera.quaternion.setFromEuler(_euler);

        // Movement
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

        // Collision Bounds
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

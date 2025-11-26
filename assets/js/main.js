import * as THREE from 'three';
import { initClassroom } from './classroom.js';
import { initOffice } from './office.js';
import { interactables } from './utils.js';
import { initGame } from './gameLogic.js';
import { showModal, closeModal, isInteracting } from './ui.js';
import { TouchControls } from './touchControls.js';
import { createTouchInteractionHandler } from './touchUtils.js';

// --- PHYSICS CONSTANTS ---
const LOOK_SPEED = 1.5;
const MOVE_SPEED = 3.0;
const MOUSE_LOOK_SPEED = 0.002;
const MIN_POLAR_ANGLE = 0.5;
const MAX_POLAR_ANGLE = 2.5;
const ROOM_BOUNDS = 4.5; // Will be updated dynamically after scene loads

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xebe5ce);
scene.fog = new THREE.Fog(0xebe5ce, 5, 30);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 3.5); // First-person height
camera.lookAt(0, 1.4, 0);

// --- CUSTOM KEYBOARD CONTROLS ---
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _PI_2 = Math.PI / 2;
const _vector = new THREE.Vector3();

function moveForward(distance) {
    _vector.setFromMatrixColumn(camera.matrix, 0);
    _vector.crossVectors(camera.up, _vector);
    camera.position.addScaledVector(_vector, distance);
}

function moveRight(distance) {
    _vector.setFromMatrixColumn(camera.matrix, 0);
    camera.position.addScaledVector(_vector, distance);
}

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- CACHED DOM ELEMENTS ---
const crosshair = document.getElementById('crosshair');
const instructions = document.getElementById('instructions');
const clueModal = document.getElementById('clueModal');

// --- LOGIC ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0); // Initialize to center
const mouseDelta = new THREE.Vector2();
let lastMousePos = new THREE.Vector2();
let isMouseDown = false;

// --- DYNAMIC BOUNDS ---
let roomBounds = { minX: -ROOM_BOUNDS, maxX: ROOM_BOUNDS, minZ: -ROOM_BOUNDS, maxZ: ROOM_BOUNDS };

function calculateRoomBounds() {
    // Calculate actual room bounds from scene geometry
    const box = new THREE.Box3();
    scene.traverse((object) => {
        if (object.isMesh && object.name.includes('wall')) {
            box.expandByObject(object);
        }
    });

    if (!box.isEmpty()) {
        const padding = 0.5; // Keep player away from walls
        roomBounds = {
            minX: box.min.x + padding,
            maxX: box.max.x - padding,
            minZ: box.min.z + padding,
            maxZ: box.max.z - padding
        };
    }
}

// --- TOUCH CONTROLS (MOBILE) ---
let touchControls;
const handleTouchInteract = createTouchInteractionHandler({
    showModal,
    isInteracting: () => isInteracting, // Pass as function, not getter
    getContext: () => ({})
});

// --- INPUT HANDLING ---
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    Space: false
};

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) {
        keys[e.key] = true;
        keys[e.code] = true;
    }
    // Space Interaction
    if ((e.code === 'Space' || e.key === ' ')) {
        e.preventDefault(); // Prevent page scrolling
        if (isInteracting && clueModal && clueModal.style.display === 'block') {
            closeModal();
        } else if (!isInteracting) {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactables, false);
            if (intersects.length > 0) {
                showModal(intersects[0].object.name, {});
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

// Instructions Handling
if (instructions) {
    instructions.addEventListener('click', () => {
        instructions.style.display = 'none';
    });
}

// --- MOUSE INTERACTION ---
document.addEventListener('mousedown', () => { isMouseDown = true; });
document.addEventListener('mouseup', () => { isMouseDown = false; });

document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (isMouseDown && !isInteracting) {
        const deltaX = event.clientX - lastMousePos.x;
        const deltaY = event.clientY - lastMousePos.y;
        mouseDelta.x += deltaX;
        mouseDelta.y += deltaY;
    }

    lastMousePos.set(event.clientX, event.clientY);

    if (!isInteracting && crosshair) {
        crosshair.style.left = event.clientX + 'px';
        crosshair.style.top = event.clientY + 'px';
    }
});

document.addEventListener('click', (event) => {
    if (isInteracting) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactables, false);
    if (intersects.length > 0) {
        showModal(intersects[0].object.name, {});
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

    try {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;
        prevTime = time;

        // Cursor State Management
        if (!isInteracting && instructions && instructions.style.display === 'none') {
            setGameCursor(true);
        } else {
            setGameCursor(false);
        }

        if (!isInteracting) {
            // Crosshair update
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactables, false);

            if (crosshair) {
                if (intersects.length > 0) {
                    crosshair.classList.add('active');
                } else {
                    crosshair.classList.remove('active');
                }
            }

            // --- LOOK (ARROWS + TOUCH DRAG + MOUSE DRAG) ---
            _euler.setFromQuaternion(camera.quaternion);

            // Mouse Look
            if (isMouseDown) {
                _euler.y -= mouseDelta.x * MOUSE_LOOK_SPEED;
                _euler.x -= mouseDelta.y * MOUSE_LOOK_SPEED;
            }
            mouseDelta.set(0, 0);

            // Keyboard: Yaw (Left/Right Arrows)
            if (keys.ArrowLeft) _euler.y += LOOK_SPEED * delta;
            if (keys.ArrowRight) _euler.y -= LOOK_SPEED * delta;

            // Keyboard: Pitch (Up/Down Arrows)
            if (keys.ArrowUp) _euler.x += LOOK_SPEED * delta;
            if (keys.ArrowDown) _euler.x -= LOOK_SPEED * delta;

            // Touch: Camera look delta
            if (touchControls) {
                const lookDelta = touchControls.getLookDelta();
                _euler.y -= lookDelta.x * 2;
                _euler.x -= lookDelta.y * 2;
            }

            // Clamp Pitch
            _euler.x = Math.max(_PI_2 - MAX_POLAR_ANGLE, Math.min(_PI_2 - MIN_POLAR_ANGLE, _euler.x));
            camera.quaternion.setFromEuler(_euler);

            // --- MOVE (WASD + TOUCH JOYSTICK) ---
            const actualSpeed = MOVE_SPEED * delta;

            // Keyboard movement
            if (keys.w || keys.KeyW) moveForward(actualSpeed);
            if (keys.s || keys.KeyS) moveForward(-actualSpeed);
            if (keys.a || keys.KeyA) moveRight(-actualSpeed);
            if (keys.d || keys.KeyD) moveRight(actualSpeed);

            // Touch joystick movement
            if (touchControls) {
                const moveState = touchControls.getMovement();
                if (moveState.forward) moveForward(actualSpeed);
                if (moveState.backward) moveForward(-actualSpeed);
                if (moveState.left) moveRight(-actualSpeed);
                if (moveState.right) moveRight(actualSpeed);
            }

            // Dynamic Bounds
            const pos = camera.position;
            pos.x = Math.max(roomBounds.minX, Math.min(roomBounds.maxX, pos.x));
            pos.z = Math.max(roomBounds.minZ, Math.min(roomBounds.maxZ, pos.z));
        }

        renderer.render(scene, camera);
    } catch (error) {
        console.error("Animation loop error:", error);
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Expose for development/debugging only
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    window.camera = camera;
    window.scene = scene;
    window.renderer = renderer;
}

// --- SCENE INITIALIZATION ---
async function initializeGame() {
    const path = window.location.pathname;

    try {
        // Wait for scene to fully load before initializing game
        if (path.includes('classroom.html')) {
            await initClassroom(scene);
        } else if (path.includes('office.html')) {
            await initOffice(scene);
        } else {
            await initOffice(scene); // Default scene
        }

        // Calculate room bounds after scene loads
        calculateRoomBounds();

        // Initialize touch controls and game logic after scene is ready
        touchControls = new TouchControls(camera, raycaster, interactables, handleTouchInteract);
        initGame();

        // Start animation loop
        animate();
    } catch (err) {
        console.error("Scene initialization error:", err);
        // Start animation anyway to prevent blank screen
        animate();
    }
}

// Initialize the game
initializeGame();

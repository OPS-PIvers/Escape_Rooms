import * as THREE from 'three';
import { initClassroom } from './classroom.js';
import { initOffice } from './office.js';
import { interactables } from './utils.js';
import { initGame } from './gameLogic.js';
import { showModal, closeModal, isInteracting } from './ui.js';
import { TouchControls } from './touchControls.js';
import { createTouchInteractionHandler } from './touchUtils.js';
import {
    LOOK_SPEED,
    MOVE_SPEED,
    MOUSE_LOOK_SPEED,
    MIN_POLAR_ANGLE,
    MAX_POLAR_ANGLE,
    INITIAL_ROOM_BOUNDS,
    MAX_ANIMATION_ERRORS,
    CAMERA_FOV,
    CAMERA_NEAR,
    CAMERA_FAR,
    CAMERA_HEIGHT,
    SCENE_BACKGROUND_COLOR
} from './constants.js';

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);
scene.fog = new THREE.Fog(SCENE_BACKGROUND_COLOR, 5, 30);

const camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, CAMERA_NEAR, CAMERA_FAR);
camera.position.set(0, CAMERA_HEIGHT, 3.5); // First-person height
camera.lookAt(0, CAMERA_HEIGHT - 0.2, 0);

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
let roomBounds = { minX: -INITIAL_ROOM_BOUNDS, maxX: INITIAL_ROOM_BOUNDS, minZ: -INITIAL_ROOM_BOUNDS, maxZ: INITIAL_ROOM_BOUNDS };

/**
 * Calculates dynamic room boundaries based on wall positions in the scene.
 * This prevents the player from walking through walls by detecting wall meshes
 * that have userData.isWall set to true and computing a bounding box around them.
 * Falls back to initial bounds if no walls are detected.
 */
function calculateRoomBounds() {
    const box = new THREE.Box3();
    let foundWalls = false;

    scene.traverse((object) => {
        if (object.isMesh && object.userData?.isWall === true) {
            box.expandByObject(object);
            foundWalls = true;
        }
    });

    if (foundWalls && !box.isEmpty()) {
        const padding = 0.5; // Keep player away from walls
        roomBounds = {
            minX: box.min.x + padding,
            maxX: box.max.x - padding,
            minZ: box.min.z + padding,
            maxZ: box.max.z - padding
        };
    }
}

// --- ERROR SCREEN ---
/**
 * Displays a user-facing error screen with recovery options.
 * @param {string} message - The error message to display
 * @param {Error} error - The original error object
 */
function showErrorScreen(message, error) {
    // Create error overlay
    const errorScreen = document.createElement('div');
    errorScreen.id = 'errorScreen';
    errorScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        color: #ff3333;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: monospace;
        text-align: center;
        padding: 20px;
    `;

    errorScreen.innerHTML = `
        <h1 style="font-size: 3em; margin-bottom: 20px;">⚠️ ERROR</h1>
        <p style="font-size: 1.5em; margin-bottom: 10px;">${message}</p>
        <p style="font-size: 1em; color: #999; margin-bottom: 30px;">${error.message}</p>
        <button id="reloadButton" style="
            padding: 15px 30px;
            font-size: 1.2em;
            background: #ff3333;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 5px;
        ">Reload Game</button>
    `;

    document.body.appendChild(errorScreen);

    document.getElementById('reloadButton')?.addEventListener('click', () => {
        window.location.reload();
    });

    console.error('Fatal error:', error);
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
        if (isInteracting) {
            closeModal();
        } else {
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
    // Capture interaction state once to prevent race conditions
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
let animationErrorCount = 0;

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

        // Reset error counter on successful frame
        animationErrorCount = 0;
    } catch (error) {
        console.error("Animation loop error:", error);
        animationErrorCount++;

        // If too many consecutive errors, show error screen
        if (animationErrorCount >= MAX_ANIMATION_ERRORS) {
            showErrorScreen("Game encountered critical errors", error);
        }
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Expose for development/debugging only (browser-compatible check)
if (window.__DEV__ === true) {
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
        // Show error screen instead of attempting to continue
        showErrorScreen("Failed to load game scene", err);
    }
}

// Initialize the game
initializeGame();

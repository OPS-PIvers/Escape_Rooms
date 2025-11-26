console.log("main.js loaded");
import * as THREE from 'three';
import { initClassroom } from './classroom.js';
import { initOffice } from './office.js';
import { interactables } from './utils.js';
import { initGame } from './gameLogic.js';
import { showModal, closeModal, isInteracting, gameWon } from './ui.js';
import { TouchControls } from './touchControls.js';
import { createTouchInteractionHandler } from './touchUtils.js';

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

// --- LOGIC ---
const crosshair = document.getElementById('crosshair');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const mouseDelta = new THREE.Vector2();
let lastMousePos = null;
let isMouseDown = false;

// --- TOUCH CONTROLS (MOBILE) ---
let touchControls;
const handleTouchInteract = createTouchInteractionHandler({
    showModal,
    get isInteracting() { return isInteracting; },
    getContext: () => ({ finalTimeStr: "00:00" })
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
    Space: false
};

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) {
        keys[e.key] = true;
        keys[e.code] = true;
    }
    // Space Interaction
    if ((e.code === 'Space' || e.key === ' ')) {
        const modal = document.getElementById('clueModal');
        if (isInteracting && modal.style.display === 'block') {
            closeModal();
        } else if (!isInteracting) {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactables, false);
            if (intersects.length > 0) {
                showModal(intersects[0].object.name, { finalTimeStr: "00:00" });
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
const instructions = document.getElementById('instructions');
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

    if (lastMousePos !== null && isMouseDown && !isInteracting) {
        const deltaX = event.clientX - lastMousePos.x;
        const deltaY = event.clientY - lastMousePos.y;
        mouseDelta.x += deltaX;
        mouseDelta.y += deltaY;
    }
    if (lastMousePos === null) {
        lastMousePos = new THREE.Vector2();
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
        showModal(intersects[0].object.name, { finalTimeStr: "00:00" });
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
let lookSpeed = 1.5;
let moveSpeed = 3.0;
let minPolarAngle = 0.5;
let maxPolarAngle = 2.5;

function animate() {
    try {
        requestAnimationFrame(animate);
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
                const mouseLookSpeed = 0.002;
                _euler.y -= mouseDelta.x * mouseLookSpeed;
                _euler.x -= mouseDelta.y * mouseLookSpeed;
            }
            mouseDelta.set(0, 0);

            // Keyboard: Yaw (Left/Right Arrows)
            if (keys.ArrowLeft) _euler.y += lookSpeed * delta;
            if (keys.ArrowRight) _euler.y -= lookSpeed * delta;

            // Keyboard: Pitch (Up/Down Arrows)
            if (keys.ArrowUp) _euler.x += lookSpeed * delta;
            if (keys.ArrowDown) _euler.x -= lookSpeed * delta;

            // Touch: Camera look delta
            if (touchControls) {
                const lookDelta = touchControls.getLookDelta();
                _euler.y -= lookDelta.x * 2;
                _euler.x -= lookDelta.y * 2;
            }

            // Clamp Pitch
            _euler.x = Math.max(_PI_2 - maxPolarAngle, Math.min(_PI_2 - minPolarAngle, _euler.x));
            camera.quaternion.setFromEuler(_euler);

            // --- MOVE (WASD + TOUCH JOYSTICK) ---
            const actualSpeed = moveSpeed * delta;

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

            // Bounds
            const pos = camera.position;
            if (pos.x < -4.5) pos.x = -4.5;
            if (pos.x > 4.5) pos.x = 4.5;
            if (pos.z < -4.5) pos.z = -4.5;
            if (pos.z > 4.5) pos.z = 4.5;
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

// Expose for verification
window.camera = camera;
window.scene = scene;
window.renderer = renderer;

// Initialize based on page
const path = window.location.pathname;
console.log("Loading scene for path:", path);

if (path.includes('classroom.html')) {
    initClassroom(scene).catch(err => console.error("Classroom init error:", err));
} else if (path.includes('office.html')) {
    initOffice(scene).catch(err => console.error("Office init error:", err));
} else {
    console.log("Loading default scene (Office)");
    initOffice(scene).catch(err => console.error("Office init error:", err));
}

// Initialize touch controls and game logic
touchControls = new TouchControls(camera, raycaster, interactables, handleTouchInteract);
initGame();
animate();
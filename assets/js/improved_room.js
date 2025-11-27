// improved_room.js
console.log("improved_room.js loaded");
import * as THREE from 'three';
import { loadModel } from './modelLoader.js';
import { createRoom, placeObject, placeOnSurface } from './RoomUtils.js';
import {
    TILE_SCALE,
    ROOM_SIZE,
    WALL_SIZE,
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

// --- STATE ---
let doorPivot;
let finalTimeStr = "12:00";
let roomBounds = { minX: -5, maxX: 5, minZ: -5, maxZ: 5 };

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);
scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, CAMERA_HEIGHT, 0);

// --- LIGHTING ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(-5, 10, -5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// --- ROOM GENERATION ---
(async () => {
    // 1. Create Basic Room
    console.log("Creating room...");
    const roomData = await createRoom(scene, 10, 10);
    roomBounds = roomData.bounds;

    // 2. Add Door
    const wallX = roomData.wallPositions.right;
    const wallZ = 0.5;

    const wallToRemove = roomData.roomGroup.children.find(child => {
        return Math.abs(child.position.x - wallX) < 0.5 &&
               Math.abs(child.position.z - wallZ) < 0.6;
    });

    if (wallToRemove) {
        console.log("Removing wall for door at", wallX, wallZ);
        roomData.roomGroup.remove(wallToRemove);
    } else {
        console.warn("Could not find wall to remove at", wallX, wallZ);
    }

    const doorGroup = new THREE.Group();
    doorGroup.position.set(wallX, 0, wallZ);
    doorGroup.rotation.y = -Math.PI / 2;
    scene.add(doorGroup);

    doorPivot = new THREE.Group();
    doorPivot.position.set(-0.75, 1.1, 0.02);
    doorGroup.add(doorPivot);

    const doorModel = await placeObject(doorPivot, interactables, 'assets/models/doorway.glb', {
        pos: [0.75, 0, 0],
        name: 'door'
    });

    const handle = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 1.0, roughness: 0.5 })
    );
    handle.position.set(0.5, 1.1, 0.1);
    doorModel.add(handle);
    console.log("Door added");

    // 3. Add Desk (Left Wall)
    console.log("Adding Desk...");
    const deskGroup = await placeObject(scene, interactables, 'assets/models/desk.glb', {
        pos: [-4, 0, 0],
        rot: [0, -Math.PI / 2, 0],
        name: 'desk'
    });

    // 4. Add Chair (In front of desk)
    console.log("Adding Chair...");
    await placeObject(scene, interactables, 'assets/models/chair.glb', {
        pos: [-3.2, 0, 0],
        rot: [0, -Math.PI / 2, 0],
        name: 'chair'
    });

    // 5. Add Lamp on Desk
    console.log("Adding Lamp...");
    const lamp = await placeObject(scene, interactables, 'assets/models/lampSquareTable.glb', {
        name: 'lamp'
    });
    // Place on Back Left corner of desk
    placeOnSurface(deskGroup, lamp, { x: -0.3, z: 0.5 });

    // 6. Add Laptop on Desk
    console.log("Adding Laptop...");
    const laptop = await placeObject(scene, interactables, 'assets/models/laptop.glb', {
        name: 'laptop'
    });
    // Place on Center Front
    placeOnSurface(deskGroup, laptop, { x: 0.1, z: 0 });
    laptop.rotation.y = -Math.PI / 2; // Face the chair

    console.log("Room setup complete");

})();

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

const handleTouchInteract = createTouchInteractionHandler({
    showModal,
    isInteracting: () => isInteracting,
    getContext: () => ({ doorPivot, finalTimeStr })
});

let touchControls;
try {
    touchControls = new TouchControls(camera, raycaster, interactables, handleTouchInteract);
} catch (e) {
    console.error("TouchControls failed to init:", e);
}

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
                let obj = intersects[0].object;
                while(obj && !obj.name && obj.parent) obj = obj.parent;
                if (obj && obj.name) {
                     showModal(obj.name, { doorPivot, finalTimeStr });
                }
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
        let obj = intersects[0].object;
        while(obj && !obj.name && obj.parent) obj = obj.parent;
        if (obj && obj.name) {
            showModal(obj.name, { doorPivot, finalTimeStr });
        }
    }
});

function setGameCursor(active) {
    if (active) {
        document.body.classList.add('game-active');
    } else {
        document.body.classList.remove('game-active');
    }
}

let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;
    prevTime = time;

    if (!isInteracting && instructions && instructions.style.display === 'none') {
        setGameCursor(true);
    } else {
        setGameCursor(false);
    }

    if (!isInteracting) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactables, false);
        if (crosshair) {
            if (intersects.length > 0) {
                crosshair.classList.add('active');
            } else {
                crosshair.classList.remove('active');
            }
        }

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

window.camera = camera;
window.scene = scene;
window.renderer = renderer;
window.interactables = interactables;

animate();

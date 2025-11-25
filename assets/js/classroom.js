console.log("main.js loaded");
import * as THREE from 'three';
import {
    loadModel
} from './modelLoader.js';
import {
    createClock
} from './prefabs/clock.js';
import {
    createShelves
} from './prefabs/shelves.js';
import {
    mat
} from './materials.js';
import {
    createBox,
    interactables
} from './utils.js';
import {
    initGame
} from './gameLogic.js';
import {
    showModal,
    closeModal,
    isInteracting,
    gameWon
} from './ui.js';
import {
    TouchControls
} from './touchControls.js';

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xebe5ce);
scene.fog = new THREE.Fog(0xebe5ce, 5, 30);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3.5, 1.6, 3.5);
camera.lookAt(0, 1.4, 0);

// --- CUSTOM KEYBOARD CONTROLS ---
const controls = {
    isLocked: true
}; // Mock 'locked' state for compatibility
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _PI_2 = Math.PI / 2;

// Movement & Look Helpers
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


// --- LIGHTING ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffdfba, 1.2);
dirLight.position.set(-10, 8, 2);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const lights = [{
    x: 2.8,
    y: 1.8,
    z: -3.2,
    col: 0xffaa00,
    int: 1.2
}, {
    x: -1,
    y: 2.0,
    z: 1.5,
    col: 0xffddaa,
    int: 0.8
}, {
    x: 3.5,
    y: 2.5,
    z: 3.5,
    col: 0xffeebb,
    int: 0.8
}];
lights.forEach(l => {
    const pl = new THREE.PointLight(l.col, l.int, 8);
    pl.position.set(l.x, l.y, l.z);
    pl.castShadow = true;
    scene.add(pl);
});

// --- ROOM ---
const roomGroup = new THREE.Group();
scene.add(roomGroup);

const tileScale = 2.5;
const roomSize = 4;
const start = -3.75;
const step = 2.5;

// Floor
for (let x = 0; x < roomSize; x++) {
    for (let z = 0; z < roomSize; z++) {
        const px = start + x * step;
        const pz = start + z * step;
        loadModel('assets/models/floorFull.glb', {
            pos: [px, 0, pz],
            scale: [tileScale, tileScale, tileScale],
            parent: roomGroup
        });
    }
}

// Walls
for (let i = 0; i < roomSize; i++) {
    const p = start + i * step;

    // Back Wall (Z=-5)
    loadModel('assets/models/wall.glb', {
        pos: [p, 0, -5],
        rot: [0, 0, 0],
        scale: [tileScale, tileScale, tileScale],
        parent: roomGroup
    });

    // Front Wall (Z=5)
    loadModel('assets/models/wall.glb', {
        pos: [p, 0, 5],
        rot: [0, Math.PI, 0],
        scale: [tileScale, tileScale, tileScale],
        parent: roomGroup
    });

    // Left Wall (X=-5) - Windows
    loadModel('assets/models/wallWindow.glb', {
        pos: [-5, 0, p],
        rot: [0, Math.PI / 2, 0],
        scale: [tileScale, tileScale, tileScale],
        parent: roomGroup
    });

    // Right Wall (X=5) - Door & Walls
    // We place the door at the second slot (index 1, Z = -1.25)
    if (i === 1) {
        loadModel('assets/models/doorway.glb', {
            pos: [5, 0, p],
            rot: [0, -Math.PI / 2, 0],
            scale: [tileScale, tileScale, tileScale],
            parent: roomGroup
        });
    } else {
        loadModel('assets/models/wall.glb', {
            pos: [5, 0, p],
            rot: [0, -Math.PI / 2, 0],
            scale: [tileScale, tileScale, tileScale],
            parent: roomGroup
        });
    }
}

// --- PROPS ---

// 1. Teacher's Desk (Front Right)
loadModel('assets/models/desk.glb', {
    pos: [2.5, 0, -3.5],
    scale: [2.5, 2.5, 2.5],
    parent: scene
});
loadModel('assets/models/chairDesk.glb', {
    pos: [2.5, 0, -2.0],
    rot: [0, Math.PI, 0],
    scale: [2.5, 2.5, 2.5],
    parent: scene
});

// Laptop on Teacher Desk
loadModel('assets/models/laptop.glb', {
    pos: [2.5, 0.75, -3.5],
    rot: [0, Math.PI, 0],
    scale: [2.0, 2.0, 2.0],
    parent: scene
}).then(model => {
    model.name = "laptop";
    interactables.push(model);
});

// 2. Blackboard (Front Wall Z=-5)
const boardGroup = new THREE.Group();
boardGroup.position.set(0, 1.8, -4.9);
scene.add(boardGroup);
createBox(6.0, 3.0, 0.1, 0x111111, 0, 0, 0, boardGroup, 0, 0, 0, "blackboard"); // Board
createBox(6.2, 0.1, 0.15, 0x5d4037, 0, -1.55, 0.05, boardGroup); // Tray
createBox(0.1, 0.02, 0.02, 0xffffff, -0.5, -1.52, 0.05, boardGroup); // Chalk
createBox(0.1, 0.02, 0.02, 0xffff00, -0.3, -1.52, 0.05, boardGroup); // Chalk

// 3. Student Desks (Grid)
const deskRows = [-1.0, 1.5, 4.0];
const deskCols = [-2.5, 0.5];

function createClassPaperStack(x, z, parent) {
    const group = new THREE.Group();
    group.position.set(x, 0.76, z); // Relative Y
    for (let i = 0; i < 5; i++) {
        const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.35), mat.paper);
        paper.rotation.x = -Math.PI / 2;
        paper.rotation.z = Math.random() * 0.5;
        paper.position.y = i * 0.005;
        group.add(paper);
    }
    parent.add(group);
}

deskRows.forEach((z, r) => {
    deskCols.forEach((x, c) => {
        // Desk
        loadModel('assets/models/table.glb', {
            pos: [x, 0, z],
            scale: [2.5, 2.5, 2.5],
            parent: scene
        }).then(model => {
            if (Math.random() > 0.5) {
                createClassPaperStack(0, 0, model);
            }
            const hit = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.8), new THREE.MeshBasicMaterial({visible:false}));
            hit.position.y = 0.8;
            hit.name = `student_desk_${r}_${c}`;
            model.add(hit);
            interactables.push(hit);
        });
        
        // Chair
        loadModel('assets/models/chair.glb', {
            pos: [x, 0, z + 0.8],
            rot: [0, Math.PI, 0],
            scale: [2.5, 2.5, 2.5],
            parent: scene
        });
    });
});

// 4. Bookshelves (Back Left)
loadModel('assets/models/bookcaseOpen.glb', {
    pos: [-4.5, 0, 4.5],
    rot: [0, Math.PI/2, 0],
    scale: [2.5, 2.5, 2.5],
    parent: scene
});
loadModel('assets/models/books.glb', { pos: [-4.5, 1.6, 4.5], rot: [0, Math.PI/2, 0], scale: [2.5, 2.5, 2.5], parent: scene })
    .then(m => { m.name="book_cluster"; interactables.push(m); });

// 5. Globe (Simple)
const globeGroup = new THREE.Group();
globeGroup.position.set(-4.5, 2.35, 4.5);
scene.add(globeGroup);
const gBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.05), mat.woodDark);
globeGroup.add(gBase);
const gSphere = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), new THREE.MeshPhongMaterial({ color: 0x1565c0 }));
gSphere.position.y = 0.25;
gSphere.name = "globe";
interactables.push(gSphere);
globeGroup.add(gSphere);

// 6. Clock
createClock(scene);

// 7. Trash Can
loadModel('assets/models/trashcan.glb', {
    pos: [4.5, 0, 1.5],
    scale: [2.5, 2.5, 2.5],
    parent: scene
}).then(m => { m.name="trash"; interactables.push(m); });

// 8. Plant
loadModel('assets/models/pottedPlant.glb', {
    pos: [-4.5, 0, -4.5],
    scale: [3.0, 3.0, 3.0],
    parent: scene
}).then(m => { m.name="plant"; interactables.push(m); });


// --- DOOR & TIMER ---
const doorGroup = new THREE.Group();
doorGroup.position.set(5, 0, -1.25); // Aligned with doorway.glb
doorGroup.rotation.y = -Math.PI / 2;
scene.add(doorGroup);
// Frame replaced by doorway.glb model

// Door Pivot Group for hinging
const doorPivot = new THREE.Group();
doorPivot.position.set(-0.75, 1.1, 0.02); // Hinge location (left side of door)
doorGroup.add(doorPivot);

// Door Mesh (relative to pivot)
// Door is 1.5 wide. Center is at +0.75 relative to pivot.
    createBox(1.5, 2.2, 0.05, mat.door, 0.75, 0, 0, doorPivot, 0, 0, 0, "door");

// Knob (relative to pivot)
// Old knob pos in doorGroup: 0.6, 1.1, 0.08
// Pivot pos in doorGroup: -0.75, 1.1, 0.02
// Relative x: 0.6 - (-0.75) = 1.35
// Relative y: 1.1 - 1.1 = 0
// Relative z: 0.08 - 0.02 = 0.06
const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04), mat.chrome);
knob.position.set(1.35, 0, 0.06);
doorPivot.add(knob);

const timerGroup = new THREE.Group();
timerGroup.position.set(0, 2.6, 0.1);
doorGroup.add(timerGroup);
createBox(0.8, 0.3, 0.1, new THREE.MeshStandardMaterial({
    color: 0x111111
}), 0, 0, 0, timerGroup);
const timerCanvas = document.createElement('canvas');
timerCanvas.width = 512;
timerCanvas.height = 256;
const tCtx = timerCanvas.getContext('2d');
const timerTexture = new THREE.CanvasTexture(timerCanvas);
const displayMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({
    map: timerTexture
}));
displayMesh.position.z = 0.06;
timerGroup.add(displayMesh);
let timeLeft = 600;
let finalTimeStr = "00:00";

function updateTimer(dt) {
    if (!gameWon) timeLeft = Math.max(0, timeLeft - dt);
    const m = Math.floor(timeLeft / 60);
    const s = Math.floor(timeLeft % 60);
    finalTimeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    const timeStr = finalTimeStr;

    // Background
    tCtx.fillStyle = '#050505';
    tCtx.fillRect(0, 0, 512, 256);

    // Scanlines
    tCtx.fillStyle = 'rgba(0, 255, 0, 0.05)';
    for (let i = 0; i < 256; i += 4) tCtx.fillRect(0, i, 512, 1);

    // Glow & Text
    tCtx.shadowColor = "#ff0000";
    tCtx.shadowBlur = 30;
    tCtx.fillStyle = '#ff3333';
    tCtx.font = 'bold 140px "Share Tech Mono", monospace';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    tCtx.fillText(timeStr, 256, 128);

    // Border
    tCtx.strokeStyle = "#550000";
    tCtx.lineWidth = 10;
    tCtx.strokeRect(5, 5, 502, 246);

    timerTexture.needsUpdate = true;
}

// --- LOGIC ---
const crosshair = document.getElementById('crosshair');
const raycaster = new THREE.Raycaster();

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- TOUCH CONTROLS (MOBILE) ---
let touchControls;
function handleTouchInteract(object) {
    if (!isInteracting) {
        showModal(object.name, {
            doorPivot: doorPivot,
            finalTimeStr: finalTimeStr
        });
    }
}
// Initialize after DOM is ready and we have doorPivot reference
// Will be initialized at the end of the script

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
        keys[e.code] = true; // Handle both key and code for safety
    }
    // Space Interaction
    if ((e.code === 'Space' || e.key === ' ')) {
        if (isInteracting && modal.style.display === 'block') {
            closeModal();
        } else if (!isInteracting) {
            // Use existing mouse raycast logic
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactables, false);
            if (intersects.length > 0) {
                showModal(intersects[0].object.name);
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
instructions.addEventListener('click', () => {
    instructions.style.display = 'none';
    isInteracting = false;
});

// --- MOUSE INTERACTION ---
const mouse = new THREE.Vector2();

document.addEventListener('mousemove', (event) => {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Move Custom Cursor (Crosshair)
    if (!isInteracting) {
        crosshair.style.left = event.clientX + 'px';
        crosshair.style.top = event.clientY + 'px';
    }
});

document.addEventListener('click', (event) => {
    if (isInteracting) return;

    // Raycast from mouse position
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactables, false);

    if (intersects.length > 0) {
        showModal(intersects[0].object.name, {
            doorPivot: doorPivot,
            finalTimeStr: finalTimeStr
        });
    }
});

function setGameCursor(active) {
    if (active) {
        document.body.classList.add('game-active');
        // Ensure crosshair tracks mouse immediately if possible, or stays at last known pos
    } else {
        document.body.classList.remove('game-active');
    }
}

// --- ANIMATION LOOP ---
let prevTime = performance.now();

// Rotation Parameters
let lookSpeed = 1.5;
let moveSpeed = 3.0;
let minPolarAngle = 0.5; // ~30 deg
let maxPolarAngle = 2.5; // ~150 deg

function animate() {
    try {
        requestAnimationFrame(animate);
        const time = performance.now();
        const delta = (time - prevTime) / 1000;
        prevTime = time;

        if (gameWon) {
            const startRot = doorPivot.rotation.y;
            const targetRot = -Math.PI / 2;
            const duration = 2000;
            const t = Math.min(delta / (duration / 1000), 1);
            const ease = 1 - Math.pow(1 - t, 3);
            doorPivot.rotation.y = startRot + (targetRot - startRot) * ease;
        }
        updateTimer(delta);

        // Cursor State Management
        if (!isInteracting && instructions.style.display === 'none') {
            setGameCursor(true);
        } else {
            setGameCursor(false);
        }

        if (!isInteracting) {
            // Crosshair / Logic Update
            // Use MOUSE position for raycasting now, as the crosshair follows the mouse
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactables, false);

            if (intersects.length > 0) {
                crosshair.classList.add('active');
                // document.body.style.cursor = 'pointer'; // Handled by custom cursor style
            } else {
                crosshair.classList.remove('active');
                // document.body.style.cursor = 'none';
            }

            // --- LOOK (ARROWS + TOUCH DRAG) ---
            _euler.setFromQuaternion(camera.quaternion);

            // Keyboard: Yaw (Left/Right Arrows)
            if (keys.ArrowLeft) _euler.y += lookSpeed * delta;
            if (keys.ArrowRight) _euler.y -= lookSpeed * delta;

            // Keyboard: Pitch (Up/Down Arrows)
            if (keys.ArrowUp) _euler.x += lookSpeed * delta;
            if (keys.ArrowDown) _euler.x -= lookSpeed * delta;

            // Touch: Camera look delta
            if (touchControls) {
                const lookDelta = touchControls.getLookDelta();
                _euler.y -= lookDelta.x * 2; // Horizontal look
                _euler.x -= lookDelta.y * 2; // Vertical look
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

// Initialize touch controls after all scene objects are ready
touchControls = new TouchControls(camera, raycaster, interactables, handleTouchInteract);

initGame();
animate();
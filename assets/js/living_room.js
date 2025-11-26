// Living Room Scene
import * as THREE from 'three';
import { loadModel } from './modelLoader.js';
import { showModal, closeModal } from './ui.js';
import { initGame } from './gameLogic.js';

// --- CONSTANTS ---
const interactables = [];
let gameWon = false;
const tileScale = 2.5;
const roomSize = 4;
const wallSize = 2.5;
const start = -3.75;

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);
scene.fog = new THREE.Fog(0x333333, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-2, 1.8, 4);
camera.lookAt(0, 1, 0);

// --- LIGHTING ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(-10, 10, -10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// --- ROOM ---
async function createRoom() {
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    const promises = [];

    // Floor
    for (let x = 0; x < roomSize; x++) {
        for (let z = 0; z < roomSize; z++) {
            const px = start + x * wallSize;
            const pz = start + z * wallSize;
            promises.push(loadModel('assets/models/floorFull.glb', {
                pos: [px, 0, pz],
                scale: [tileScale, tileScale, tileScale],
                parent: roomGroup
            }));
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
        if (i === 1) {
            promises.push(loadModel('assets/models/wallDoorway.glb', { pos: [p, 0, 5], rot: [0, Math.PI, 0], scale: [tileScale, tileScale, tileScale], parent: roomGroup }));
        } else {
            promises.push(loadModel('assets/models/wall.glb', { pos: [p, 0, 5], rot: [0, Math.PI, 0], scale: [tileScale, tileScale, tileScale], parent: roomGroup }));
        }
        promises.push(loadModel('assets/models/wall.glb', { pos: [p, 0, -5], scale: [tileScale, tileScale, tileScale], parent: roomGroup }));
        promises.push(loadModel('assets/models/wall.glb', { pos: [-5, 0, p], rot: [0, Math.PI / 2, 0], scale: [tileScale, tileScale, tileScale], parent: roomGroup }));
        promises.push(loadModel('assets/models/wall.glb', { pos: [5, 0, p], rot: [0, -Math.PI / 2, 0], scale: [tileScale, tileScale, tileScale], parent: roomGroup }));
    }
    await Promise.all(promises);
}

// --- DOOR ---
const doorPivot = new THREE.Group();
doorPivot.position.set(start + 1 * wallSize, 0, 4.9);
scene.add(doorPivot);

loadModel('assets/models/doorway.glb', {
    pos: [0, 0, 0],
    scale: [2.5, 2.5, 2.5],
    parent: doorPivot
}).then(doorModel => {
    const doorHitbox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 0.2), new THREE.MeshBasicMaterial({ visible: false }));
    doorHitbox.name = "door";
    doorHitbox.position.set(0, 1.25, 0);
    doorModel.add(doorHitbox);
    interactables.push(doorHitbox);
});


// --- LIVING ROOM FURNITURE ---
async function createInteractable(modelPath, options) {
    const model = await loadModel(modelPath, options);
    const bbox = new THREE.Box3().setFromObject(model.children[0] || model);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());

    const hitbox = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), new THREE.MeshBasicMaterial({ visible: false, opacity: 0.5, transparent: true }));
    hitbox.name = options.name;

    // Adjust center based on group's position if model is a child
    if(model.parent !== scene) {
        center.add(model.parent.position);
    }

    hitbox.position.copy(center);
    scene.add(hitbox);
    interactables.push(hitbox);
    return model;
}

async function createFurniture() {
    await Promise.all([
        createInteractable('assets/models/loungeSofa.glb', { pos: [-3, 0, -1], rot: [0, Math.PI / 2, 0], scale: [2, 2, 2], name: 'couch', parent: scene }),
        createInteractable('assets/models/tableCoffee.glb', { pos: [-3, 0, 1.5], scale: [1.5, 1.5, 1.5], name: 'coffeeTable', parent: scene }),
        loadModel('assets/models/cabinetTelevision.glb', { pos: [3.5, 0, 0], rot: [0, -Math.PI / 2, 0], scale: [1.5, 1.5, 1.5], parent: scene })
            .then(cabinet => {
                const cabinetBbox = new THREE.Box3().setFromObject(cabinet);
                const cabinetTopY = cabinetBbox.max.y;
                return createInteractable('assets/models/televisionModern.glb', { pos: [3.5, cabinetTopY, 0], rot: [0, -Math.PI / 2, 0], scale: [1, 1, 1], name: 'tv', parent: scene });
            }),
        createInteractable('assets/models/bookcaseOpen.glb', { pos: [-1.5, 0, -4], scale: [2, 2, 2], name: 'bookshelf', parent: scene })
    ]);
}


// --- RENDERER AND MAIN LOOP ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// --- EVENT LISTENERS ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('instructions').addEventListener('click', () => {
    document.getElementById('instructions').style.display = 'none';
});

document.addEventListener('click', onMouseClick, false);
function onMouseClick(event) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(interactables);
    if (intersects.length > 0) {
        const finalTimeStr = "00:00";
        showModal(intersects[0].object.name, { doorPivot, finalTimeStr });
    }
}

async function main() {
    await createRoom();
    await createFurniture();
    animate();
    initGame('classic'); // Initialize game with a default mode
}

main();

// Expose for debugging
// window.scene = scene;
// window.camera = camera;
// window.interactables = interactables;
// window.showModal = showModal;